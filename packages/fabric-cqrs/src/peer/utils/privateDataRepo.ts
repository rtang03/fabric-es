/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { Utils } from 'fabric-common';
import { Wallet } from 'fabric-network';
import { keys } from 'lodash';
import { Store } from 'redux';
import { action } from '../../cqrs/command';
import { generateToken } from '../../cqrs/utils';
import { Commit, PrivatedataRepository, Reducer } from '../../types';
import { fromCommitsToGroupByEntityId } from './fromCommitsToGroupByEntityId';
import { getHistory } from './getHistory';
import { getPromiseToSave } from './getPromiseToSave';

const {
  deleteByEntityIdCommitId,
  DELETE_ERROR,
  DELETE_SUCCESS,
  QUERY_SUCCESS,
  QUERY_ERROR,
  queryByEntityId,
  queryByEntityName
} = action;

export const privateDataRepo: (option: {
  store: Store;
  channelEventHub: string;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
}) => <TEntity = any, TEvent = any>(option: {
  entityName: string;
  reducer: Reducer;
}) => PrivatedataRepository<TEntity, TEvent> = ({ store, channelEventHub, channelName, connectionProfile, wallet }) => <
  TEntity,
  TEvent
>({
  entityName,
  reducer
}) => {
  const logger = Utils.getLogger('[fabric-cqrs] privateDataRepo.js');

  return {
    create: ({ enrollmentId, id }) => ({
      save: events =>
        getPromiseToSave({
          channelEventHub,
          channelName,
          connectionProfile,
          wallet,
          id,
          entityName,
          version: 0,
          events,
          store,
          enrollmentId,
          isPrivateData: true
        })
    }),
    getById: ({ enrollmentId, id }) =>
      new Promise<{
        currentState: TEntity;
        save: (events: TEvent[]) => Promise<Commit | { error: any }>;
      }>((resolve, reject) => {
        const tid = generateToken();
        const unsubscribe = store.subscribe(() => {
          const { tx_id, result, error, type } = store.getState().write;
          if (tx_id === tid && type === QUERY_SUCCESS) {
            logger.info(util.format('queryByEntityId, tx_id: %s, %s', tid, QUERY_SUCCESS));

            unsubscribe();
            resolve({
              currentState: reducer(getHistory(result)),
              save: events =>
                getPromiseToSave({
                  channelEventHub,
                  channelName,
                  connectionProfile,
                  wallet,
                  id,
                  entityName,
                  events,
                  version: keys(result).length,
                  store,
                  enrollmentId,
                  isPrivateData: true
                })
            });
          }

          if (tx_id === tid && type === QUERY_ERROR) {
            logger.warn(util.format('queryByEntityId, tx_id: %s, %s, %j', tid, QUERY_ERROR, error));

            unsubscribe();
            reject({ error });
          }
        });

        store.dispatch(
          queryByEntityId({
            channelEventHub,
            channelName,
            connectionProfile,
            wallet,
            tx_id: tid,
            args: { id, entityName, isPrivateData: true }
          })
        );

        logger.info(util.format('queryByEntityId, tx_id: %s, %s, %s', tid, id, entityName));
      }),
    getByEntityName: () =>
      new Promise<{ data: TEntity[] }>((resolve, reject) => {
        const tid = generateToken();
        const unsubscribe = store.subscribe(() => {
          const { tx_id, result, error, type } = store.getState().write;
          if (tx_id === tid && type === QUERY_SUCCESS) {
            logger.info(util.format('queryByEntityName, tx_id: %s, %s', tid, QUERY_SUCCESS));

            unsubscribe();
            resolve({
              data: fromCommitsToGroupByEntityId<TEntity>(result, reducer)
            });
          }

          if (tx_id === tid && type === QUERY_ERROR) {
            logger.warn(util.format('queryByEntityName, tx_id: %s, %s, %j', tid, QUERY_ERROR, error));

            unsubscribe();
            reject({ error });
          }
        });

        store.dispatch(
          queryByEntityName({
            channelEventHub,
            channelName,
            connectionProfile,
            wallet,
            tx_id: tid,
            args: { entityName, isPrivateData: true }
          })
        );

        logger.info(util.format('queryByEntityName, tx_id: %s, %s', tid, entityName));
      }),
    deleteByEntityIdCommitId: (id, commitId) =>
      new Promise<any>((resolve, reject) => {
        const tid = generateToken();
        const unsubscribe = store.subscribe(() => {
          const { tx_id, result, error, type } = store.getState().write;
          if (tx_id === tid && type === DELETE_SUCCESS) {
            logger.info(util.format('deleteByEntityIdCommitId, tx_id: %s, %s', tid, DELETE_SUCCESS));

            unsubscribe();
            resolve(result);
          }

          if (tx_id === tid && type === DELETE_ERROR) {
            logger.warn(util.format('deleteByEntityIdCommitId, tx_id: %s, %s, %j', tid, DELETE_ERROR, error));

            unsubscribe();
            reject({ error });
          }
        });

        store.dispatch(
          deleteByEntityIdCommitId({
            channelEventHub,
            channelName,
            connectionProfile,
            wallet,
            tx_id: tid,
            args: { entityName, id, commitId, isPrivateData: true }
          })
        );

        logger.info(util.format('deleteByEntityIdCommitId, tx_id: %s, %s, %s', tid, id, entityName));
      }),
    getEntityName: () => entityName
  };
};
