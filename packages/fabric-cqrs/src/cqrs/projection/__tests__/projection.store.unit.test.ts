import { Store } from 'redux';
import { reducer } from '../../../example';
import { createProjectionDb, createQueryDatabase } from '../../../peer';
import { Commit } from '../../../types';
import { action as queryAction } from '../../query';
import { generateToken } from '../../../store/utils';
import { action } from '../action';
import { getStore } from './__utils__/store';

let store: Store;
const context: any = {
  projectionDb: createProjectionDb('test-entity'),
  queryDatabase: createQueryDatabase(),
  reducer
};

beforeAll(() => {
  store = getStore(context);
});

describe('CQRS - projection Tests', () => {
  it('should upsert many', done => {
    const commits: Record<string, Commit> = {
      '001': {
        id: '1000',
        entityName: 'test-entity',
        events: [{ type: 'ADD' }]
      },
      '002': {
        id: '1000',
        entityName: 'test-entity',
        events: [{ type: 'ADD' }]
      },
      '003': {
        id: '1000',
        entityName: 'test-entity',
        events: [{ type: 'MINUS' }]
      },
      '004': {
        id: '2000',
        entityName: 'test-entity',
        events: [{ type: 'ADD' }]
      },
      '005': {
        id: '2000',
        entityName: 'test-entity',
        events: [{ type: 'ADD' }]
      }
    };
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().projection;
      if (tx_id === tid && type === action.UPSERT_MANY_SUCCESS) {
        expect(result).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.upsertMany({ tx_id: tid, args: { commits }, store }));
  });

  it('should find #1 by All', done => {
    const tid = generateToken();
    const all = true;
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().projection;
      if (tx_id === tid && type === action.FIND_SUCCESS) {
        expect(result).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.find({ tx_id: tid, args: { all }, store }));
  });

  it('should find #2 by where', done => {
    const tid = generateToken();
    const where = { value: 2 };
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().projection;
      if (tx_id === tid && type === action.FIND_SUCCESS) {
        expect(result).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.find({ tx_id: tid, args: { where }, store }));
  });

  it('should upsert', done => {
    const tid = generateToken();
    const commit: Record<string, Commit> = {
      '1001': {
        id: '91000',
        entityName: 'test-entity',
        events: [{ type: 'ADD' }]
      },
      '1002': {
        id: '91000',
        entityName: 'test-entity',
        events: [{ type: 'ADD' }]
      },
      '1003': {
        id: '91000',
        entityName: 'test-entity',
        events: [{ type: 'MINUS' }]
      }
    };
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().projection;
      if (tx_id === tid && type === action.UPSERT_SUCCESS) {
        expect(result).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.upsert({ tx_id: tid, args: { commit }, store }));
  });

  it('should find #3 by contain', done => {
    const tid = generateToken();
    const contain = '9';
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().projection;
      if (tx_id === tid && type === action.FIND_SUCCESS) {
        expect(result).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.find({ tx_id: tid, args: { contain }, store }));
  });

  it('should do projection, when QueryDB is merged', done => {
    const tid = generateToken();
    const commit: Commit = {
      id: '101000',
      commitId: '20181208155814607',
      entityName: 'test-entity',
      entityId: 'ent_test_1001',
      version: 0,
      events: [{ type: 'ADD' }]
    };
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().projection;
      if (tx_id === tid && type === action.UPSERT_SUCCESS) {
        expect(result).toEqual({ '101000': {} });
        unsubscribe();
        done();
      }
    });
    store.dispatch(queryAction.merge({ tx_id: tid, args: { commit }, store }));
  });

  it('should find #4 by where', done => {
    const tid = generateToken();
    const where = { id: '101000' };
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().projection;
      if (tx_id === tid && type === action.FIND_SUCCESS) {
        expect(result).toEqual([{ id: '101000', value: 1 }]);
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.find({ tx_id: tid, args: { where }, store }));
  });
});
