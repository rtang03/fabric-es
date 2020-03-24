/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import Client from 'fabric-client';
import { Wallet } from 'fabric-network';
import { keys, values } from 'lodash';
import { Store } from 'redux';
import { action as writeAction } from '../../cqrs/command';
import { action as projectionAction } from '../../cqrs/projection';
import { action as queryAction } from '../../cqrs/query';
import { generateToken } from '../../cqrs/utils';
import { Commit, Reducer, Repository } from '../../types';
import { fromCommitsToGroupByEntityId } from './fromCommitsToGroupByEntityId';
import { getHistory } from './getHistory';
import { getPromiseToSave } from './getPromiseToSave';

export const repository: (option: {
  store: Store;
  channelEventHub: string;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
}) => <TEntity = any, TEvent = any>(option: {
  entityName: string;
  reducer: Reducer;
}) => Repository<TEntity, TEvent> = ({ store, channelEventHub, channelName, connectionProfile, wallet }) => <
  TEntity,
  TEvent
>({
  entityName,
  reducer
}) => {
  const logger = Client.getLogger('repository.js');

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
          enrollmentId
        })
    }),
    getById: ({ enrollmentId, id }) =>
      new Promise<{
        currentState: TEntity;
        save: (events: TEvent[]) => Promise<Commit | { error: any }>;
      }>(resolve => {
        const tid = generateToken();
        const { QUERY_SUCCESS, queryByEntityId } = queryAction;
        const unsubscribe = store.subscribe(() => {
          const { tx_id, result, type } = store.getState().query;
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
                  enrollmentId
                })
            });
          }
        });

        store.dispatch(
          queryByEntityId({
            tx_id: tid,
            args: { id, entityName }
          })
        );

        logger.info(util.format('queryByEntityId, tx_id: %s, %s, %s', tid, id, entityName));
      }),
    getByEntityName: () =>
      new Promise<{ data: TEntity[] }>(resolve => {
        const tid = generateToken();
        const { QUERY_SUCCESS, queryByEntityName } = queryAction;
        const unsubscribe = store.subscribe(() => {
          const { query } = store.getState();
          const { tx_id, result, type } = query;
          if (tx_id === tid && type === QUERY_SUCCESS) {
            logger.info(util.format('queryByEntityName, tx_id: %s, %s', tid, QUERY_SUCCESS));

            unsubscribe();
            resolve({
              data: fromCommitsToGroupByEntityId<TEntity>(result, reducer)
            });
          }
        });

        store.dispatch(
          queryByEntityName({
            tx_id: tid,
            args: { entityName }
          })
        );

        logger.info(util.format('queryByEntityName, tx_id: %s, %s', tid, entityName));
      }),
    getCommitById: id =>
      new Promise<{ data: Commit[] }>(resolve => {
        const tid = generateToken();
        const { QUERY_SUCCESS, queryByEntityId } = queryAction;
        const unsubscribe = store.subscribe(() => {
          const { tx_id, result, type } = store.getState().query;
          if (tx_id === tid && type === QUERY_SUCCESS) {
            logger.info(util.format('getCommitById, tx_id: %s, %s', tid, QUERY_SUCCESS));

            unsubscribe();
            resolve({ data: values(result).reverse() });
          }
        });

        store.dispatch(
          queryByEntityId({
            tx_id: tid,
            args: { id, entityName }
          })
        );

        logger.info(util.format('getCommitById, tx_id: %s, %s, %s', tid, id, entityName));
      }),
    getProjection: criteria =>
      new Promise<{ data: TEntity[] }>(resolve => {
        const tid = generateToken();
        const { FIND_SUCCESS, find } = projectionAction;
        const unsubscribe = store.subscribe(() => {
          const { projection } = store.getState();
          const { tx_id, result, type } = projection;
          if (tx_id === tid && type === FIND_SUCCESS) {
            logger.info(util.format('getProjection, tx_id %s, %s', tid, FIND_SUCCESS));

            unsubscribe();
            resolve({ data: result });
          }
        });

        store.dispatch(
          find({
            tx_id: tid,
            args: criteria,
            store
          })
        );

        logger.info(util.format('getProjection, tx_id: %s', tid));
      }),
    deleteByEntityId: id =>
      new Promise<any>((resolve, reject) => {
        const tid = generateToken();
        const { deleteByEntityId, DELETE_ERROR, DELETE_SUCCESS } = writeAction;
        const unsubscribe = store.subscribe(() => {
          const { tx_id, result, error, type } = store.getState().write;
          if (tx_id === tid && type === DELETE_SUCCESS) {
            logger.info(util.format('deleteByEntityId, tx_id: %s, %s', tid, DELETE_SUCCESS));
            unsubscribe();
            resolve(result);
          }

          if (tx_id === tid && type === DELETE_ERROR) {
            logger.warn(util.format('deleteByEntityId, tx_id: %s, %s, %j', tid, DELETE_ERROR, error));

            unsubscribe();
            reject({ error });
          }
        });

        store.dispatch(
          deleteByEntityId({
            channelEventHub,
            channelName,
            connectionProfile,
            wallet,
            tx_id: tid,
            args: { entityName, id }
          })
        );

        logger.info(util.format('deleteByEntityId, tx_id: %s, %s', tid, entityName));
      }),
    deleteByEntityName_query: () =>
      new Promise<any>(resolve => {
        const tid = generateToken();
        const { DELETE_SUCCESS, deleteByEntityName } = queryAction;
        const unsubscribe = store.subscribe(() => {
          const { tx_id, result, type } = store.getState().query;
          if (tx_id === tid && type === DELETE_SUCCESS) {
            logger.info(util.format('deleteByEntityName_query, tx_id: %s, %s', tid, DELETE_SUCCESS));

            unsubscribe();
            resolve(result);
          }
        });

        store.dispatch(deleteByEntityName({ tx_id: tid, args: { entityName } }));

        logger.info(util.format('deleteByEntityName_query, tx_id: %s, %s', tid, entityName));
      }),
    getEntityName: () => entityName
  };
};
