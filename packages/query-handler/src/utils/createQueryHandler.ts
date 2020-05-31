import util from 'util';
import { BaseEvent, getHistory, Reducer, Commit, isCommit } from '@fabric-es/fabric-cqrs';
import { Contract, ContractListener, Network } from 'fabric-network';
import isEqual from 'lodash/isEqual';
import values from 'lodash/values';
import { getStore } from '../store';
import { action as commandAction } from '../store/command';
import { action as projAction } from '../store/projection';
import { action as queryAction } from '../store/query';
import { action as reconcileAction } from '../store/reconcile';
import {
  FabricResponse,
  GetByEntityNameResponse,
  QueryDatabaseResponse,
  QueryHandler,
  QueryHandlerOptions,
} from '../types';
import {
  catchErrors,
  dispatcher,
  fromCommitsToGroupByEntityId,
  getLogger,
  isCommitRecord,
  isFabricResponse,
} from '.';

export const createQueryHandler: (options: QueryHandlerOptions) => Promise<QueryHandler> = async (
  options
) => {
  const { gateway, queryDatabase, channelName, wallet, connectionProfile, reducers } = options;
  const logger = getLogger({ name: '[query-handler] createQueryHandler.js' });
  options.queryDatabase = queryDatabase;
  options.logger = logger;

  const store = getStore(options);

  const {
    deleteByEntityId,
    deleteByEntityName,
    queryByEntityId,
    queryByEntityName,
    QUERY_SUCCESS,
    QUERY_ERROR,
    DELETE_SUCCESS,
    DELETE_ERROR,
  } = queryAction;

  let contractListener: ContractListener;
  let contract: Contract;
  let network: Network;

  const addTimestamp: (events: BaseEvent[]) => BaseEvent[] = (events) =>
    events.map((event) => ({
      ...event,
      payload: Object.assign({}, event.payload, { ts: Math.round(new Date().getTime() / 1000) }),
    }));

  return {
    command_create: ({ enrollmentId, id, entityName }) => ({
      save: dispatcher<Record<string, Commit>, { events: BaseEvent[] }>(
        ({ tx_id, args: { events } }) =>
          commandAction.create({
            channelName,
            connectionProfile,
            wallet,
            tx_id,
            enrollmentId,
            args: {
              entityName,
              id,
              version: 0,
              isPrivateData: false,
              events: addTimestamp(events),
            },
          }),
        {
          name: 'command_create',
          store,
          slice: 'write',
          SuccessAction: commandAction.CREATE_SUCCESS,
          ErrorAction: commandAction.CREATE_ERROR,
          logger,
          typeGuard: isCommitRecord,
        }
      ),
    }),
    command_deleteByEntityId: () =>
      dispatcher<FabricResponse, { entityName: string; id: string }>(
        ({ tx_id, args: { entityName, id } }) =>
          commandAction.deleteByEntityId({
            connectionProfile,
            channelName,
            wallet,
            tx_id,
            args: { entityName, id, isPrivateData: false },
          }),
        {
          name: 'command_deleteByEntityId',
          store,
          slice: 'write',
          SuccessAction: commandAction.DELETE_SUCCESS,
          ErrorAction: commandAction.DELETE_ERROR,
          logger,
          typeGuard: isFabricResponse,
        }
      ),
    command_getByEntityName: () =>
      dispatcher<Record<string, Commit>, { entityName: string }>(
        ({ tx_id, args: { entityName } }) =>
          commandAction.queryByEntityName({
            connectionProfile,
            channelName,
            wallet,
            tx_id,
            args: { entityName, isPrivateData: false },
          }),
        {
          name: 'command_getByEntityName',
          store,
          slice: 'write',
          SuccessAction: commandAction.QUERY_SUCCESS,
          ErrorAction: commandAction.QUERY_ERROR,
          logger,
          typeGuard: isCommitRecord,
        }
      ),
    query_getById: async <TEntity>({ enrollmentId, id, entityName, reducer }) => {
      const { data } = await dispatcher<Record<string, Commit>, { entityName: string; id: string }>(
        (payload) => queryByEntityId(payload),
        {
          name: 'queryByEntityId',
          store,
          slice: 'query',
          SuccessAction: QUERY_SUCCESS,
          ErrorAction: QUERY_ERROR,
          logger,
        }
      )({ id, entityName });

      const currentState = isEqual(data, {}) ? null : reducer(getHistory(data));
      const version = Object.keys(data).length;
      const save = isEqual(data, {})
        ? null
        : dispatcher<Record<string, Commit>, { events: any[] }>(
            ({ tx_id, args: { events } }) =>
              commandAction.create({
                channelName,
                connectionProfile,
                wallet,
                tx_id,
                enrollmentId,
                args: {
                  entityName,
                  id,
                  version,
                  isPrivateData: false,
                  events: addTimestamp(events),
                },
              }),
            {
              name: 'create',
              store,
              slice: 'write',
              SuccessAction: commandAction.CREATE_SUCCESS,
              ErrorAction: commandAction.CREATE_ERROR,
              logger,
              typeGuard: isCommitRecord,
            }
          );
      return { currentState, save };
    },
    query_getByEntityName: <TEntity>({ entityName }) =>
      dispatcher<GetByEntityNameResponse<TEntity>, { entityName: string }>(
        (payload) => queryByEntityName(payload),
        {
          name: 'getByEntityName',
          store,
          slice: 'query',
          SuccessAction: QUERY_SUCCESS,
          ErrorAction: QUERY_ERROR,
          logger,
        },
        (commits) => fromCommitsToGroupByEntityId<TEntity>(commits, reducers[entityName])
      ),
    query_getCommitById: () =>
      dispatcher<Commit[], { id: string; entityName: string }>(
        (payload) => queryByEntityId(payload),
        {
          name: 'getCommitByid',
          store,
          slice: 'query',
          SuccessAction: QUERY_SUCCESS,
          ErrorAction: QUERY_ERROR,
          logger,
        },
        (result) => values<Commit>(result).reverse()
      ),
    query_deleteByEntityId: () =>
      dispatcher<QueryDatabaseResponse, { entityName: string; id: string }>(
        (payload) => deleteByEntityId(payload),
        {
          name: 'deleteByEntityId',
          store,
          slice: 'query',
          SuccessAction: DELETE_SUCCESS,
          ErrorAction: DELETE_ERROR,
          logger,
        }
      ),
    query_deleteByEntityName: () =>
      dispatcher<QueryDatabaseResponse, { entityName: string }>(
        (payload) => deleteByEntityName(payload),
        {
          name: 'deleteByEntityName',
          store,
          slice: 'query',
          SuccessAction: DELETE_SUCCESS,
          ErrorAction: DELETE_ERROR,
          logger,
        }
      ),
    reconcile: () =>
      dispatcher<any, { entityName: string }>(
        ({ tx_id, args }) =>
          reconcileAction.reconcile({ tx_id, args, store, channelName, connectionProfile, wallet }),
        {
          name: 'reconcile',
          store,
          slice: 'reconcile',
          SuccessAction: reconcileAction.RECONCILE_SUCCESS,
          ErrorAction: reconcileAction.RECONCILE_ERROR,
          logger,
        }
      ),
    subscribeHub: async () => {
      logger.info('♨️  subscribe channel event hub');
      network = await gateway.getNetwork(channelName);
      contract = network.getContract('eventstore');
      contractListener = network.getContract('eventstore').addContractListener(
        async ({ payload, eventName, getTransactionEvent }) => {
          logger.info(`💢  event arrives - tx_id: ${getTransactionEvent().transactionId}`);
          let commit: unknown;
          if (eventName !== 'createCommit') {
            logger.warn(`receive unexpected contract event: ${eventName}`);
            return;
          }

          try {
            commit = JSON.parse(payload.toString('utf8'));
          } catch (e) {
            logger.error(util.format('fail to parse contract event, %j', e));
            return;
          }

          if (isCommit(commit)) {
            // step 1. merge one commit to commit records in QueryDatabase
            const doMergeCommit = await dispatcher<string[], { commit: Commit }>(
              (payload) => queryAction.mergeCommit(payload),
              {
                name: 'merge_one_commit',
                store,
                slice: 'query',
                SuccessAction: queryAction.MERGE_COMMIT_SUCCESS,
                ErrorAction: queryAction.MERGE_COMMIT_ERROR,
                logger,
              }
            )({ commit });

            console.log(doMergeCommit.data);

            // step 2. merge one commit to entity record in QueryDatabase
            const doMergeEntity = await dispatcher<
              { key: string; status: string },
              { commit: Commit }
            >((payload) => projAction.mergeEntity(payload), {
              name: 'merge_one_entity',
              store,
              slice: 'projection',
              SuccessAction: projAction.MERGE_ENTITY_SUCCESS,
              ErrorAction: projAction.MERGE_ENTITY_ERROR,
              logger,
            })({ commit });

            console.log(doMergeEntity.data);

            // step 3.
            // Send to pubsub
          } else logger.warn(util.format('receive contract events of unknown type, %j', commit));
        },
        { type: 'full' }
      );
      return true;
    },
    unsubscribeHub: () => contract.removeContractListener(contractListener),
    disconnect: () => gateway.disconnect(),
    commitFTSearch: async ({ query }) =>
      catchErrors(queryDatabase.fullTextSearchCommit({ query }), {
        fcnName: 'full text search',
        logger,
      }),
    // todo: entityFTSearch
  };
};
