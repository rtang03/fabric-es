require('../../../env');
import { FileSystemWallet } from 'fabric-network';
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
const channelEventHub = process.env.CHANNEL_HUB;
const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const wallet = new FileSystemWallet(process.env.WALLET);

beforeAll(async () => {
  try {
    context = await bootstrapNetwork({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      channelEventHub,
      channelName,
      connectionProfile,
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet,
      enrollmentId,
      enrollmentSecret: 'password'
    });

    store = getStore(context);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(() => {
  context.gateway.disconnect();
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
        args: { entityName, id: enrollmentId },
        channelEventHub,
        connectionProfile,
        channelName,
        wallet
      })
    );
  });

  it('should createEntity', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.CREATE_SUCCESS) {
        commitId = values(result)[0].commitId;
        expect(pick(values(result)[0], ['entityName', 'version', 'events'])).toMatchSnapshot();
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
        enrollmentId,
        channelEventHub,
        connectionProfile,
        channelName,
        wallet
      })
    );
  });

  it('should queryByEntityIdCommitId', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(pick(values(result)[0], ['entityName', 'version', 'events'])).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntIdCommitId({
        tx_id: tid,
        args: { entityName, commitId, id: enrollmentId },
        channelEventHub,
        connectionProfile,
        channelName,
        wallet
      })
    );
  });

  it('should queryByEntityName', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(pick(values(result)[0], ['entityName', 'version', 'events'])).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntityName({
        tx_id: tid,
        args: { entityName },
        channelEventHub,
        connectionProfile,
        channelName,
        wallet
      })
    );
  });

  it('should queryByEntityId', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.QUERY_SUCCESS) {
        expect(pick(values(result)[0], ['entityName', 'version', 'events'])).toMatchSnapshot();
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntityId({
        tx_id: tid,
        args: { entityName, id: enrollmentId },
        channelEventHub,
        connectionProfile,
        channelName,
        wallet
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
        args: { entityName, id: enrollmentId, commitId },
        channelEventHub,
        connectionProfile,
        channelName,
        wallet
      })
    );
  });
});
