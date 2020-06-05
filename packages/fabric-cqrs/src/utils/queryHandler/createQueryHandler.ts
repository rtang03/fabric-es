import util from 'util';
import { Contract, ContractListener, Network } from 'fabric-network';
import {
  commandCreate,
  commandDeleteByEntityId,
  commandGetByEntityName,
  dispatcher,
  getLogger,
  isCommit,
  queryDeleteByEntityId,
  queryDeleteByEntityName,
  queryGetByEntityName,
  queryGetById,
  queryGetCommitById,
} from '..';
import { getStore } from '../../store';
import { action as projAction } from '../../store/projection';
import { action as reconcileAction } from '../../store/reconcile';
import type { Commit, QueryHandler, QueryHandlerOptions } from '../../types';
import { catchErrors } from '.';

export const createQueryHandler: (options: QueryHandlerOptions) => Promise<QueryHandler> = async (
  options
) => {
  const { gateway, queryDatabase, channelName, wallet, connectionProfile, reducers } = options;
  const logger = getLogger({ name: '[query-handler] createQueryHandler.js' });
  options.queryDatabase = queryDatabase;
  options.logger = logger;

  const store = getStore(options as any);

  let contractListener: ContractListener;
  let contract: Contract;
  let network: Network;

  const commandOption = {
    logger,
    wallet,
    store,
    connectionProfile,
    channelName,
  };
  const queryOption = { logger, store };

  return {
    create: <TEvent = any>(entityName) => commandCreate<TEvent>(entityName, false, commandOption),
    command_deleteByEntityId: (entityName) =>
      commandDeleteByEntityId(entityName, false, commandOption),
    command_getByEntityName: (entityName) =>
      commandGetByEntityName(entityName, false, commandOption),
    query_getById: <TEntity = any, TEvent = any>(entityName) =>
      queryGetById<TEntity, TEvent>(entityName, false, commandOption),
    query_getByEntityName: <TEntity = any>(entityName) =>
      queryGetByEntityName<TEntity>(entityName, reducers[entityName], queryOption),
    query_getCommitById: (entityName) => queryGetCommitById(entityName, queryOption),
    query_deleteByEntityId: (entityName) => queryDeleteByEntityId(entityName, queryOption),
    query_deleteByEntityName: (entityName) => queryDeleteByEntityName(entityName, queryOption),
    reconcile: () =>
      dispatcher<{ key: string; status: string }[], { entityName: string }>(
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

            logger.info(
              util.format('mergeComit: %j', mergeEntityResult?.data || 'no data written')
            );

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
    fullTextSearchCIdx: async ({ query }) =>
      catchErrors(queryDatabase.fullTextSearchCommit({ query }), {
        fcnName: 'full text search',
        logger,
      }),
    // todo: entityFTSearch
  };
};
