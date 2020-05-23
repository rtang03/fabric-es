import util from 'util';
import {
  generateToken,
  getHistory,
  fromCommitsToGroupByEntityId,
  Reducer,
  Commit,
  isCommit,
} from '@fabric-es/fabric-cqrs';
import { Utils } from 'fabric-common';
import { Contract, ContractListener, Network } from 'fabric-network';
import values from 'lodash/values';
import { getStore } from '../store';
import { action as queryAction } from '../store/query';
import { action as reconcileAction } from '../store/reconcile';
import { QueryHandler, QueryHandlerOptions } from '../types';
import { dispatcher } from './dispatcher';

export const createQueryHandler: (options: QueryHandlerOptions) => Promise<QueryHandler> = async (options) => {
  const { gateway, projectionDatabase, queryDatabase, channelName, wallet, connectionProfile } = options;
  options.queryDatabase = queryDatabase;
  options.projectionDatabase = projectionDatabase;

  const store = getStore(options);
  const logger = Utils.getLogger('[fabric-cqrs] createQueryHandler.js');
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
    getById: <TEntity>(reducer) =>
      dispatcher<TEntity, { entityName: string; id: string }>(
        (payload) => queryByEntityId(payload),
        { name: 'getById', store, slice: 'query', SuccessAction: QUERY_SUCCESS, ErrorAction: QUERY_ERROR, logger },
        (result) => reducer(getHistory(result))
      ),

    getByEntityName: <TEntity>(reducer) =>
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

    getCommitById: () =>
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
    deleteByEntityName: () =>
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
