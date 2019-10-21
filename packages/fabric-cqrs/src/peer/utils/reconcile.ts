import { Store } from 'redux';
import { action } from '../../cqrs/reconcile';
import { generateToken } from '../../cqrs/utils';
import { Reducer } from '../../types';

const { RECONCILE_SUCCESS, RECONCILE_ERROR } = action;

export const reconcile: (
  store: Store
) => (option: {
  entityName: string;
  reducer: Reducer;
}) => Promise<{ result: any }> = store => ({ entityName, reducer }) =>
  new Promise<{ result: any }>((resolve, reject) => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, error, type } = store.getState().reconcile;
      if (tx_id === tid && type === RECONCILE_SUCCESS) {
        unsubscribe();
        resolve({ result });
      }
      if (tx_id === tid && type === RECONCILE_ERROR) {
        unsubscribe();
        reject({ error });
      }
    });
    store.dispatch(
      action.reconcile({
        tx_id: tid,
        args: { entityName, reducer },
        store
      })
    );
  });
