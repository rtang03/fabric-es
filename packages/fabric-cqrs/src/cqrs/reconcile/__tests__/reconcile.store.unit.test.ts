import { Store } from 'redux';
import { createQueryDatabase } from '../../../peer';
import { generateToken } from '../../../store/utils';
import { action } from '../action';
import { getStore } from './__utils__/store';

jest.mock('../../../services/evaluate');

let store: Store;
const context: any = { queryDatabase: createQueryDatabase() };

beforeAll(async () => {
  store = getStore(context);
});

describe('CQRS - reconcile Tests', () => {
  it('should reconcile', done => {
    const tid = generateToken();
    const entityName = 'reconcile_test';
    const reducer = null;
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().reconcile;
      if (tx_id === tid && type === action.RECONCILE_SUCCESS) {
        expect(result).toEqual({ '20181208155814606': {} });
        unsubscribe();
        done();
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
});
