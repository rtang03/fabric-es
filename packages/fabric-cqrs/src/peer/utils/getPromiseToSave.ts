import { values } from 'lodash';
import { Store } from 'redux';
import { action as writeAction } from '../../cqrs/command';
import { generateToken } from '../../cqrs/utils';
import { Commit } from '../../types';

export const getPromiseToSave: (option: {
  entityName: string;
  id: string;
  events: any[];
  version: number;
  store: Store;
  collection?: string;
  enrollmentId?: string;
}) => Promise<Commit> = ({
  entityName,
  id,
  events,
  version,
  store,
  collection,
  enrollmentId
}) =>
  new Promise((resolve, reject) => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, type, result, error } = store.getState().write;
      if (tx_id === tid && type === writeAction.CREATE_SUCCESS) {
        unsubscribe();
        resolve(values(result)[0] as Commit);
      }
      if (tx_id === tid && type === writeAction.CREATE_ERROR) {
        unsubscribe();
        reject({ error });
      }
    });
    store.dispatch(writeAction.create({
      tx_id: tid,
      args: { entityName, id, version, events, collection },
      enrollmentId
    }) as any);
  });
