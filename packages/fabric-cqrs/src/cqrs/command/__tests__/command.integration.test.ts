require('../../../env');
import { pick, values } from 'lodash';
import { Store } from 'redux';
import { bootstrapNetwork } from '../../../account';
import { PeerOptions } from '../../../types';
import { generateToken } from '../../utils';
import { action } from '../action';
import { getStore } from './__utils__/store';

let context: Partial<PeerOptions>;
let commitId: string;
let store: Store;
const entityName = 'command_test';
const enrollmentId = `command_test${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  context = await bootstrapNetwork({
    enrollmentId,
    enrollmentSecret: 'password'
  });
  store = getStore(context);
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
      if (tx_id === tid && type === action.DELETE_SUCCESS) {
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.deleteByEntityId({
        tx_id: tid,
        args: { entityName, id: enrollmentId }
      })
    );
  });

  it('should createEntity', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.CREATE_SUCCESS) {
        commitId = values(result)[0].commitId;
        expect(
          pick(values(result)[0], ['entityName', 'version', 'events'])
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
          id: enrollmentId,
          version: 0,
          events: [{ type: 'User Created', payload: { name: 'me' } }]
        },
        // Special attention: createAction will be based on newly created account (given below
        // enrollmentId; to using a new Fabric contract, to submit transaction, and based on its x509
        // cert. Other actions does not require to supply enrollmentId, and will keep using admin ecert
        enrollmentId
      })
    );
  });

  it('should queryByEntityIdCommitId', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(
          pick(values(result)[0], ['entityName', 'version', 'events'])
        ).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntIdCommitId({
        tx_id: tid,
        args: { entityName, commitId, id: enrollmentId }
      })
    );
  });

  it('should queryByEntityName', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(
          pick(values(result)[0], ['entityName', 'version', 'events'])
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
          pick(values(result)[0], ['entityName', 'version', 'events'])
        ).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntityId({
        tx_id: tid,
        args: { entityName, id: enrollmentId }
      })
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
        args: { entityName, id: enrollmentId, commitId }
      })
    );
  });
});
