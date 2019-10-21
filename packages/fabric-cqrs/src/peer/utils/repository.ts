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

export const repository: (
  store: Store
) => <TEntity = any, TEvent = any>(option: {
  entityName: string;
  reducer: Reducer;
}) => Repository<TEntity, TEvent> = store => <TEntity, TEvent>({
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
        store
      })
  }),
  getById: id =>
    new Promise<{
      currentState: TEntity;
      save: (events: TEvent[]) => Promise<Commit | { error: any }>;
    }>(resolve => {
      const tid = generateToken();
      const { QUERY_SUCCESS, queryByEntityId } = queryAction;
      const unsubscribe = store.subscribe(() => {
        const { tx_id, result, type } = store.getState().query;
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
                store
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
    }),
  getByEntityName: () =>
    new Promise<{ data: TEntity[] }>(resolve => {
      const tid = generateToken();
      const { QUERY_SUCCESS, queryByEntityName } = queryAction;
      const unsubscribe = store.subscribe(() => {
        const { query } = store.getState();
        const { tx_id, result, type } = query;
        if (tx_id === tid && type === QUERY_SUCCESS) {
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
    }),
  getCommitById: id =>
    new Promise<{ data: Commit[] }>(resolve => {
      const tid = generateToken();
      const { QUERY_SUCCESS, queryByEntityId } = queryAction;
      const unsubscribe = store.subscribe(() => {
        const { tx_id, result, type } = store.getState().query;
        if (tx_id === tid && type === QUERY_SUCCESS) {
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
    }),
  getProjection: criteria =>
    new Promise<{ data: TEntity[] }>(resolve => {
      const tid = generateToken();
      const { FIND_SUCCESS, find } = projectionAction;
      const unsubscribe = store.subscribe(() => {
        const { projection } = store.getState();
        const { tx_id, result, type } = projection;
        if (tx_id === tid && type === FIND_SUCCESS) {
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
    }),
  deleteByEntityId: id =>
    new Promise<any>((resolve, reject) => {
      const tid = generateToken();
      const { deleteByEntityId, DELETE_ERROR, DELETE_SUCCESS } = writeAction;
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
        deleteByEntityId({
          tx_id: tid,
          args: { entityName, id }
        })
      );
    }),
  deleteByEntityName_query: () =>
    new Promise<any>(resolve => {
      const tid = generateToken();
      const { DELETE_SUCCESS, deleteByEntityName } = queryAction;
      const unsubscribe = store.subscribe(() => {
        const { tx_id, result, type } = store.getState().query;
        if (tx_id === tid && type === DELETE_SUCCESS) {
          unsubscribe();
          resolve(result);
        }
      });
      store.dispatch(deleteByEntityName({ tx_id: tid, args: { entityName } }));
    })
});
