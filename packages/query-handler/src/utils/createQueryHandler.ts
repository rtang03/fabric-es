import util from 'util';
import {
  BaseEvent,
  generateToken,
  getHistory,
  fromCommitsToGroupByEntityId,
  Reducer,
  Commit,
  isCommit,
} from '@fabric-es/fabric-cqrs';
import { Contract, ContractListener, Network } from 'fabric-network';
import values from 'lodash/values';
import { getStore } from '../store';
import { action as commandAction } from '../store/command';
import { action as queryAction } from '../store/query';
import { action as reconcileAction } from '../store/reconcile';
import { FabricResponse, QueryHandler, QueryHandlerOptions } from '../types';
import { dispatcher, getLogger, isCommitRecord, isFabricResponse } from '.';

export const createQueryHandler: (options: QueryHandlerOptions) => Promise<QueryHandler> = async (options) => {
  const { gateway, projectionDatabase, queryDatabase, channelName, wallet, connectionProfile } = options;
  options.queryDatabase = queryDatabase;
  options.projectionDatabase = projectionDatabase;

  const store = getStore(options);
  const logger = getLogger({ name: '[query-handler] createQueryHandler.js' });

  const {
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
            args: { entityName, id, version: 0, isPrivateData: false, events },
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
    command_queryByEntityName: () =>
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
    query_getById: async <TEntity>(enrollmentId: string, id: string, entityName: string, reducer) => {
      const result = await dispatcher<Record<string, Commit>, { entityName: string; id: string }>(
        (payload) => queryByEntityId(payload),
        { name: 'getById', store, slice: 'query', SuccessAction: QUERY_SUCCESS, ErrorAction: QUERY_ERROR, logger },
        (result) => reducer(getHistory(result))
      )({ id, entityName }).then(({ data }) => data);

      const currentState = reducer(getHistory(result));
      const version = Object.keys(result).length;

      return {
        currentState,
        save: dispatcher<Record<string, Commit>, { events: any[] }>(
          ({ tx_id, args: { events } }) =>
            commandAction.create({
              channelName,
              connectionProfile,
              wallet,
              tx_id,
              enrollmentId,
              args: { entityName, id, version, isPrivateData: false, events },
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
        ),
      };
    },
    query_getByEntityName: <TEntity>(reducer) =>
      dispatcher<TEntity[], { entityName: string }>(
        (payload) => queryByEntityName(payload),
        {
          name: 'getByEntityName',
          store,
          slice: 'query',
          SuccessAction: QUERY_SUCCESS,
          ErrorAction: QUERY_ERROR,
          logger,
        },
        (result) => fromCommitsToGroupByEntityId<TEntity>(result, reducer)
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
    query_deleteByEntityName: () =>
      dispatcher<any, { entityName: string }>((payload) => deleteByEntityName(payload), {
        name: 'deleteByEntityName',
        store,
        slice: 'query',
        SuccessAction: DELETE_SUCCESS,
        ErrorAction: DELETE_ERROR,
        logger,
      }),
    reconcile: () =>
      dispatcher<any, { entityName: string; reducer: Reducer }>(
        ({ tx_id, args }) => reconcileAction.reconcile({ tx_id, args, store, channelName, connectionProfile, wallet }),
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
      logger.info('subscribe channel event hub');
      network = await gateway.getNetwork(channelName);
      contract = network.getContract('eventstore');
      contractListener = network.getContract('eventstore').addContractListener(
        ({ chaincodeId, payload, eventName }) => {
          logger.info(`subscribed event arrives from ${chaincodeId}`);
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
            store.dispatch(queryAction.merge({ tx_id: generateToken(), args: { commit } }));
          } else logger.warn(util.format('receive contract events of unknown type, %j', commit));
        },
        { type: 'full' }
      );
    },
    unsubscribeHub: () => contract.removeContractListener(contractListener),
    disconnect: () => gateway.disconnect(),
  };
};
