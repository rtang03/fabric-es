import util from 'util';
import { Contract, ContractListener, Network } from 'fabric-network';
import { getStore } from '../store';
import { action as projAction } from '../store/projection';
import { action as reconcileAction } from '../store/reconcile';
import type {
  Commit,
  PaginatedCommitCriteria,
  PaginatedEntityCriteria,
  PubSubPayload,
  PubSubSysEvent,
  QueryHandler,
  QueryHandlerEntity,
  QueryHandlerOptions,
} from '../types';
import {
  commandCreate,
  commandDeleteByEntityId,
  commandGetByEntityName,
  dispatcher,
  getLogger,
  isCommit,
  queryDeleteCommitByEntityId,
  queryDeleteCommitByEntityName,
  queryGetEntityByEntityName,
  queryGetById,
  queryGetCommitByEntityId,
  queryNotify,
  doPaginatedSearch,
  queryGetPaginatedEntityById,
  queryGetPaginatedCommitById,
  doPaginatedFullTextSearch,
  queryGetEntityInfo,
} from '../utils';

/**
 * ♨️  Create query handler
 - see example at [subscribe.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/queryHandler/__tests__/subscribe.unit-test.ts)
 * ```typescript
 * // example
 * const wallet = await Wallets.newFileSystemWallet(walletPath);
 * const redis = new Redis();
 * const queryDatabase = createQueryData(redis);
 * const networkConfig = await getNetwork({
 *     discovery: true,
 *     asLocalhost: true,
 *     channelName,
 *     connectionProfile,
 *     wallet,
 *     enrollmentId,
 * })
 * const queryHandler = createQueryHandler({
 *     entityNames: [entityName],
 *     gateway: networkConfig.gateway
 *     network: networkConfig.network,
 *     queryDatabase,
 *     connectionProfile,
 *     channelName,
 *     wallet,
 *     reducers
 * });
 * ```
 * @params options [[QueryHandlerOptions]]
 */
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
      queryGetEntityByEntityName<TEntity>(entityName, reducers[entityName], queryOption),
    getCommitById: (entityName) => queryGetCommitByEntityId(entityName, queryOption),
    query_deleteCommitByEntityId: (entityName) =>
      queryDeleteCommitByEntityId(entityName, queryOption),
    query_deleteCommitByEntityName: (entityName) =>
      queryDeleteCommitByEntityName(entityName, queryOption),
    getPaginatedEntityById: <TResult>(entityName) =>
      doPaginatedSearch<TResult, PaginatedEntityCriteria>(
        entityName,
        queryGetPaginatedEntityById,
        queryOption
      ),
    getPaginatedCommitById: (entityName) =>
      doPaginatedSearch<Commit, PaginatedCommitCriteria>(
        entityName,
        queryGetPaginatedCommitById,
        queryOption
      ),
    fullTextSearchCommit: doPaginatedFullTextSearch<Commit>('cidx', queryOption),
    fullTextSearchEntity: doPaginatedFullTextSearch<QueryHandlerEntity>('eidx', queryOption),
    queryGetEntityInfo: queryGetEntityInfo(queryOption),
    queryNotify: queryNotify(queryOption),
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
            logger.debug(`💢  event arrives - tx_id: ${getTransactionEvent().transactionId}`);
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
      } catch (err) {
        logger.error(
          util.format('❌  failed to subscribeHub. cannot addContractlistner', err)
        );
        return Promise.reject(new Error('failed to subscribeHub. cannot addContractlistner'));
      }
      return true;
    },
    unsubscribeHub: () => contract.removeContractListener(contractListener),
    disconnect: () => gateway.disconnect(),
  };
};
