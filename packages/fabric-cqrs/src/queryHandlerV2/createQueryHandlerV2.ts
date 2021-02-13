import util from 'util';
import { Contract, ContractListener, Network } from 'fabric-network';
import { getStore } from '../store';
import { action as projAction } from '../store/projection';
import { action as queryAction } from '../store/query';
import { action as reconcileAction } from '../store/reconcile';
import type { Commit, PubSubPayload, PubSubSysEvent } from '../types';
import {
  commandCreate,
  commandDeleteByEntityId,
  commandGetByEntityName,
  dispatcher,
  getLogger,
  getPaginated,
  isCommit,
  queryDeleteCommitByEntityId,
  queryDeleteCommitByEntityName,
  queryFullTextSearch,
  queryGetById,
  queryGetCommitByEntityId,
  queryGetEntityByEntityName,
} from '../utils';
import { INVALID_ARG } from './constants';
import type { OutputCommit, QueryHandlerOption, QueryHandlerV2 } from './types';

export const createQueryHandlerV2: (options: QueryHandlerOption) => QueryHandlerV2 = (options) => {
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
    clearNotification: async ({ creator, entityName, id, commitId }) =>
      dispatcher<string[], { creator: string; entityName: string; id: string; commitId: string }>(
        (payload) => queryAction.clearNotification(payload),
        {
          store,
          logger,
          name: 'query:clearNotification',
          slice: 'query',
          SuccessAction: queryAction.CLEAR_NOTI_SUCCESS,
          ErrorAction: queryAction.CLEAR_NOTI_ERROR,
        }
      )({ creator, entityName, id, commitId }),
    clearNotifications: async ({ creator, entityName, id }) =>
      dispatcher<string[], { creator: string; entityName: string; id: string }>(
        (payload) => queryAction.clearNotifications(payload),
        {
          store,
          logger,
          name: 'query:clearNotifications',
          slice: 'query',
          SuccessAction: queryAction.CLEAR_NOTI_SUCCESS,
          ErrorAction: queryAction.CLEAR_NOTI_ERROR,
        }
      )({ creator, entityName, id }),
    create: <TEvent = any>(entityName) => {
      if (!entityNames.includes(entityName)) throw new Error(INVALID_ARG);

      return commandCreate<TEvent>(entityName, false, commandOption);
    },
    command_deleteByEntityId: (entityName) => {
      if (!entityNames.includes(entityName)) throw new Error(INVALID_ARG);

      return commandDeleteByEntityId(entityName, false, commandOption);
    },
    command_getByEntityName: (entityName) => {
      if (!entityNames.includes(entityName)) throw new Error(INVALID_ARG);

      return commandGetByEntityName(entityName, false, commandOption);
    },
    getById: <TEntity = any, TEvent = any>(entityName) =>
      queryGetById<TEntity, TEvent>(entityName, reducers[entityName], false, commandOption),
    getByEntityName: <TEntity = any>(entityName) =>
      queryGetEntityByEntityName<TEntity>(entityName, reducers[entityName], queryOption),
    getCommitById: (entityName) => queryGetCommitByEntityId(entityName, queryOption),
    query_deleteCommitByEntityId: (entityName) =>
      queryDeleteCommitByEntityId(entityName, queryOption),
    query_deleteCommitByEntityName: (entityName) =>
      queryDeleteCommitByEntityName(entityName, queryOption),
    query_deleteEntityByEntityName: (entityName) => () =>
      dispatcher<number, { entityName: string }>(
        (payload) => queryAction.deleteEntityByEntityName(payload),
        {
          store,
          logger,
          slice: 'query',
          name: 'query:deleteEntityByEntityName',
          SuccessAction: queryAction.DELETE_ENTITY_SUCCESS,
          ErrorAction: queryAction.DELETE_ENTITY_ERROR,
        }
      )({ entityName }),
    fullTextSearchCommit: async <OutputCommit>({ query, param, cursor, pagesize }) =>
      queryFullTextSearch({ store, logger, query, param, cursor, pagesize }),
    fullTextSearchEntity: async <TEntity>({ query, param, cursor, pagesize, entityName }) =>
      queryFullTextSearch({ store, logger, query, param, cursor, pagesize, entityName }),
    getNotification: async ({ creator, entityName, id, commitId }) =>
      dispatcher<
        Record<string, string>,
        { creator: string; entityName: string; id: string; commitId: string }
      >((payload) => queryAction.getNotifications(payload), {
        store,
        logger,
        name: 'query:getNotification',
        slice: 'query',
        SuccessAction: queryAction.GET_NOTI_SUCCESS,
        ErrorAction: queryAction.GET_NOTI_ERROR,
      })({ creator, entityName, id, commitId }),
    getNotifications: async ({ creator, entityName, id }) =>
      dispatcher<Record<string, string>, { creator: string; entityName: string; id: string }>(
        (payload) => queryAction.getNotifications(payload),
        {
          store,
          logger,
          name: 'query:getNotifications',
          slice: 'query',
          SuccessAction: queryAction.GET_NOTI_SUCCESS,
          ErrorAction: queryAction.GET_NOTI_ERROR,
        }
      )({ creator, entityName, id }),
    disconnect: () => gateway.disconnect(),
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
      try {
        network = await gateway.getNetwork(channelName);
      } catch (err) {
        logger.error(
          util.format('❌  failed to subscribeHub. cannot getNetwork from gateway', err)
        );
        return Promise.reject(new Error('failed to subscribeHub. cannot getNetwork from gateway'));
      }
      contract = network.getContract('eventstore');
      try {
        contractListener = await network.getContract('eventstore').addContractListener(
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
                logger.debug(
                  util.format('mergeComit: %j', mergeEntityResult?.data || 'no data written')
                );
              else logger.error(util.format('❌ fail to mergeEntity, %j', mergeEntityResult));

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
      } catch (err) {
        logger.error(util.format('❌  failed to subscribeHub. cannot addContractlistner', err));
        return Promise.reject(new Error('failed to subscribeHub. cannot addContractlistner'));
      }
      return true;
    },
    unsubscribeHub: () => contract.removeContractListener(contractListener),
  };
};
