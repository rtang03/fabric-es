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

export const privateDataRepo: (
  store: Store,
  collection: string
) => <TEntity = any, TEvent = any>(option: {
  entityName: string;
  reducer: Reducer;
}) => PrivatedataRepository<TEntity, TEvent> = (store, collection) => <
  TEntity,
  TEvent
>({
  entityName,
  reducer
}) => ({
  create: id => ({
    save: events =>
      getPromiseToSave({
        id,
        entityName,
        version: 0,
        events,
        store,
        collection
      })
  }),
  getById: id =>
    new Promise<{
      currentState: TEntity;
      save: (events: TEvent[]) => Promise<Commit | { error: any }>;
    }>((resolve, reject) => {
      const tid = generateToken();
      const unsubscribe = store.subscribe(() => {
        const { tx_id, result, error, type } = store.getState().write;
        if (tx_id === tid && type === QUERY_SUCCESS) {
          unsubscribe();
          resolve({
            currentState: reducer(getHistory(result)),
            save: events =>
              getPromiseToSave({
                id,
                entityName,
                events,
                version: keys(result).length,
                store,
                collection
              })
          });
        }
        if (tx_id === tid && type === QUERY_ERROR) {
          unsubscribe();
          reject({ error });
        }
      });
      store.dispatch(
        queryByEntityId({
          tx_id: tid,
          args: { id, entityName, collection }
        })
      );
    }),
  getByEntityName: () =>
    new Promise<{ data: TEntity[] }>((resolve, reject) => {
      const tid = generateToken();
      const unsubscribe = store.subscribe(() => {
        const { tx_id, result, error, type } = store.getState().write;
        if (tx_id === tid && type === QUERY_SUCCESS) {
          unsubscribe();
          resolve({
            data: fromCommitsToGroupByEntityId<TEntity>(result, reducer)
          });
        }
        if (tx_id === tid && type === QUERY_ERROR) {
          unsubscribe();
          reject({ error });
        }
      });
      store.dispatch(
        queryByEntityName({
          tx_id: tid,
          args: { entityName, collection }
        })
      );
    }),
  deleteByEntityIdCommitId: (id, commitId) =>
    new Promise<any>((resolve, reject) => {
      const tid = generateToken();
      const unsubscribe = store.subscribe(() => {
        const { tx_id, result, error, type } = store.getState().write;
        if (tx_id === tid && type === DELETE_SUCCESS) {
          unsubscribe();
          resolve(result);
        }
        if (tx_id === tid && type === DELETE_ERROR) {
          unsubscribe();
          reject({ error });
        }
      });
      store.dispatch(
        deleteByEntityIdCommitId({
          tx_id: tid,
          args: { entityName, id, commitId, collection }
        })
      );
    })
});
