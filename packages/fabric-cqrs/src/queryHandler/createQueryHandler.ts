import util from 'util';
import { Contract, ContractListener, Network } from 'fabric-network';
import { getStore } from '../store';
import { action as projAction } from '../store/projection';
import { action as queryAction } from '../store/query';
import { action as reconcileAction } from '../store/reconcile';
import type {
  Commit,
  PubSubPayload,
  PubSubSysEvent,
  QueryHandler,
  QueryHandlerOptions,
} from '../types';
import {
  commandCreate,
  commandDeleteByEntityId,
  commandGetByEntityName,
  dispatcher,
  getLogger,
  isCommit,
  isCommitRecord,
  queryDeleteByEntityId,
  queryDeleteByEntityName,
  queryGetByEntityName,
  queryGetById,
  queryGetCommitById,
} from '../utils';

export const createQueryHandler: (options: QueryHandlerOptions) => QueryHandler = (options) => {
  const {
    entityNames,
    gateway,
    queryDatabase,
    channelName,
    wallet,
    connectionProfile,
    reducers,
    pubSub,
  } = options;
  const logger = getLogger({ name: '[query-handler] createQueryHandler.js' });
  options.queryDatabase = queryDatabase;
  options.logger = logger;

  const store = getStore(options as any);

  let contractListener: ContractListener;
  let contract: Contract;
  let network: Network;

  const commandOption = { logger, wallet, store, connectionProfile, channelName };
  const queryOption = { logger, store };

  return {
    create: <TEvent = any>(entityName) => {
      if (!entityNames.includes(entityName)) throw new Error('invalid entityName');

      return commandCreate<TEvent>(entityName, false, commandOption);
    },
    command_deleteByEntityId: (entityName) =>
      commandDeleteByEntityId(entityName, false, commandOption),
    command_getByEntityName: (entityName) =>
      commandGetByEntityName(entityName, false, commandOption),
    getById: <TEntity = any, TEvent = any>(entityName) =>
      queryGetById<TEntity, TEvent>(entityName, reducers[entityName], false, commandOption),
    getByEntityName: <TEntity = any>(entityName) =>
      queryGetByEntityName<TEntity>(entityName, reducers[entityName], queryOption),
    getCommitById: (entityName) => queryGetCommitById(entityName, queryOption),
    query_deleteByEntityId: (entityName) => queryDeleteByEntityId(entityName, queryOption),
    query_deleteByEntityName: (entityName) => queryDeleteByEntityName(entityName, queryOption),
    fullTextSearchCommit: () =>
      dispatcher<Record<string, Commit>, { query: string }>(
        (payload) => queryAction.cIdxSearch(payload),
        {
          name: 'cIdxSearch',
          store,
          slice: 'query',
          SuccessAction: queryAction.SEARCH_SUCCESS,
          ErrorAction: queryAction.SEARCH_ERROR,
          logger,
          typeGuard: isCommitRecord,
        }
      ),
    fullTextSearchEntity: <TEntity>() =>
      dispatcher<Record<string, TEntity>, { query: string }>(
        (payload) => queryAction.eIdxSearch(payload),
        {
          name: 'eIdxSearch',
          store,
          slice: 'query',
          SuccessAction: queryAction.SEARCH_SUCCESS,
          ErrorAction: queryAction.SEARCH_ERROR,
          logger,
        }
      ),
    reconcile: () =>
      dispatcher<{ key: string; status: string }[], { entityName: string }>(
        ({ tx_id, args }) =>
          reconcileAction.reconcile({
            tx_id,
            args,
            store,
            channelName,
            connectionProfile,
            wallet,
          }),
        {
          name: 'reconcile',
          store,
          slice: 'reconcile',
          SuccessAction: reconcileAction.RECONCILE_SUCCESS,
          ErrorAction: reconcileAction.RECONCILE_ERROR,
          logger,
        }
      ),
    subscribeHub: async (entityNames) => {
      logger.info('♨️  subscribe channel event hub');
      network = await gateway.getNetwork(channelName);
      contract = network.getContract('eventstore');
      contractListener = network.getContract('eventstore').addContractListener(
        async ({ payload, eventName, getTransactionEvent }) => {
          logger.info(`💢  event arrives - tx_id: ${getTransactionEvent().transactionId}`);
          // check eventName
          let commit: unknown;
          if (eventName !== 'createCommit') {
            logger.warn(`receive unexpected contract event: ${eventName}`);
            return;
          }

          // parse commit
          try {
            commit = JSON.parse(payload.toString('utf8'));
          } catch (e) {
            logger.error(util.format('fail to parse contract event, %j', e));
            return;
          }

          // check commit type
          if (isCommit(commit)) {
            // filter subscribed entityNames
            if (!entityNames.includes(commit?.entityName)) {
              logger.warn(
                util.format(
                  'receive commit of unsubscribed entityName, %s:%s',
                  commit.entityName,
                  commit.id
                )
              );
              return;
            }

            // dispatch
            const mergeEntityResult = await dispatcher<
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

            if (mergeEntityResult.status === 'OK')
              logger.info(
                util.format('mergeComit: %j', mergeEntityResult?.data || 'no data written')
              );
            else logger.error(util.format('fail to mergeEntity, %j', mergeEntityResult));

            // send merged entity to PubSub
            if (pubSub && mergeEntityResult.status === 'OK') {
              const events = [];
              commit.events.forEach((event) => events.push(event?.type));

              await pubSub
                .publish<PubSubPayload>('COMMIT_ARRIVED', {
                  entityAdded: {
                    commit,
                    events,
                    key: mergeEntityResult?.data[0]?.key,
                  },
                })
                .catch((e) => {
                  logger.error(util.format('fail to publish commit, %j, %j ', commit, e));
                });
            } else if (pubSub && mergeEntityResult.status !== 'OK') {
              await pubSub.publish<PubSubSysEvent>('SYSTEM_EVENT', {
                systemEvent: {
                  ...mergeEntityResult,
                  error: JSON.stringify(mergeEntityResult?.error),
                  event: 'FAIL_TO_MERGE_ENTITY_TO_QDB',
                  timestamp: Date.now(),
                },
              });
            }
          } else logger.error(util.format('receive commit of unknown type, %j', commit));
        },
        { type: 'full' }
      );
      return true;
    },
    unsubscribeHub: () => contract.removeContractListener(contractListener),
    disconnect: () => gateway.disconnect(),
  };
};
