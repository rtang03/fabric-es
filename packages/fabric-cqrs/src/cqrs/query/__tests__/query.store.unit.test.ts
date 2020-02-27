import { pick, values } from 'lodash';
import { Store } from 'redux';
import { createQueryDatabase } from '../../../peer';
import { Commit } from '../../../types';
import { createCommit, generateToken } from '../../utils';
import { getStore } from './__utils__/store';
import { action } from '..';

let context: any;
let store: Store;
const entityName = 'dev_test';
const id = 'unit_test_01';
const events = [{ type: 'User Created', payload: { name: 'May' } }];
const commit1 = createCommit({ id, version: 0, entityName, events });

beforeAll(async () => {
  context = { queryDatabase: createQueryDatabase() };
  store = getStore(context);
});

describe('CQRS - query Tests', () => {
  it('should queryByEntityName', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().query;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(pick(values(result)[0], ['id', 'entityName', 'version', 'events'])).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.queryByEntityName({ tx_id: tid, args: { entityName } }));
  });

  it('should queryByEntityId', done => {
    const tid = generateToken();
    const default_Id = 'ent_test_1001';
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().query;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(pick(values(result)[0], ['id', 'entityName', 'version', 'events'])).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntityId({
        tx_id: tid,
        args: { entityName, id: default_Id }
      })
    );
  });

  it('should merge', done => {
    const tid = generateToken();
    const commit = createCommit({
      id,
      version: 0,
      entityName,
      events: [{ type: 'User Created', payload: { name: 'April' } }]
    });
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().query;
      if (tx_id === tid && type === action.MERGE_SUCCESS) {
        expect(pick(values(result)[0], ['id', 'entityName', 'version', 'events'])).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.merge({ tx_id: tid, args: { commit } }));
  });

  it('should mergeBatch', done => {
    const tid = generateToken();
    const commit2 = createCommit({ id, version: 0, entityName, events });
    const commits = {};
    commits[commit1.commitId] = commit1;
    commits[commit2.commitId] = commit2;
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().query;
      if (tx_id === tid && type === action.MERGE_BATCH_SUCCESS) {
        expect(result).toEqual({
          [commit1.commitId]: {},
          [commit2.commitId]: {}
        });
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.mergeBatch({ tx_id: tid, args: { entityName, commits } }));
  });

  // validate merge and mergeBatch
  it('should queryByEntityName #2', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().query;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        values<Commit>(result)
          .map(commit => pick(commit, ['id', 'entityName', 'version', 'events']))
          .forEach(commit => expect(commit).toMatchSnapshot());
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.queryByEntityName({ tx_id: tid, args: { entityName } }));
  });

  it('should deleteByEntityId', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().query;
      if (tx_id === tid && type === action.DELETE_SUCCESS) {
        expect(result).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.deleteByEntityId({
        tx_id: tid,
        args: { entityName, id: commit1.id }
      })
    );
  });

  it('should deleteByEntityName', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().query;
      if (tx_id === tid && type === action.DELETE_SUCCESS) {
        expect(result).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.deleteByEntityName({ tx_id: tid, args: { entityName } }));
  });

  // validate deleteByEntityId and deleteByEntityName
  it('should queryByEntityName #3', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().query;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(result).toEqual({});
        unsubscribe();
        done();
      }
    });
    store.dispatch(action.queryByEntityName({ tx_id: tid, args: { entityName } }));
  });
});
