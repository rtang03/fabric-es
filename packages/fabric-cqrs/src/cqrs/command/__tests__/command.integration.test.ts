import { pick, values } from 'lodash';
import { Store } from 'redux';
import { registerUser } from '../../../account/registerUser';
import { getNetwork } from '../../../services';
import { Context } from '../../../types';
import { generateToken } from '../../utils';
import { action } from '../action';
import { getStore } from './__utils__/store';

let context: Context;
let commitId: string;
let store: Store;
const entityName = 'command_test';
const id = 'command_unit_test_01';
const identity = `command_test${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  try {
    await registerUser({
      enrollmentID: identity,
      enrollmentSecret: 'password'
    });
    context = await getNetwork({ identity });
    store = getStore(context);
  } catch (error) {
    console.error(error);
    process.exit(-1);
  }
});

afterAll(async () => {
  await context.gateway.disconnect();
});

describe('CQRS - command Tests', () => {
  // tear-up
  it('should deleteByEntityId', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, type } = store.getState().write;
      if (tx_id === tid && type === action.DELETE_ERROR) {
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.deleteByEntityId({ tx_id: tid, args: { entityName, id } })
    );
  });

  it('should createEntity', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.CREATE_SUCCESS) {
        commitId = values(result)[0].commitId;
        expect(
          pick(values(result)[0], ['id', 'entityName', 'version', 'events'])
        ).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.create({
        tx_id: tid,
        args: {
          entityName,
          id,
          version: 0,
          events: [{ type: 'User Created', payload: { name: 'me' } }]
        }
      })
    );
  });

  it('should queryByEntityIdCommitId', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(
          pick(values(result)[0], ['id', 'entityName', 'version', 'events'])
        ).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntIdCommitId({
        tx_id: tid,
        args: { entityName, commitId, id }
      })
    );
  });

  it('should queryByEntityName', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(
          pick(values(result)[0], ['id', 'entityName', 'version', 'events'])
        ).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntityName({ tx_id: tid, args: { entityName } })
    );
  });

  it('should queryByEntityId', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(
          pick(values(result)[0], ['id', 'entityName', 'version', 'events'])
        ).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntityId({ tx_id: tid, args: { entityName, id } })
    );
  });

  it('should deleteByEntityIdCommitId', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.DELETE_SUCCESS) {
        expect(result.status).toBe('SUCCESS');
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.deleteByEntityIdCommitId({
        tx_id: tid,
        args: { entityName, id, commitId }
      })
    );
  });
});
