require('../../../env');
import { FileSystemWallet } from 'fabric-network';
import { pick, values } from 'lodash';
import { Store } from 'redux';
import { bootstrapNetwork } from '../../../account';
import { Commit } from '../../../types';
import { generateToken } from '../../utils';
import { action } from '../action';
import { getStore } from './__utils__/store';

let context: any;
let commitId: string;
let store: Store;
const collection = 'etcPrivateDetails';
const entityName = 'store_privatedata';
const enrollmentId = `store_privatedata${Math.floor(Math.random() * 1000)}`;
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
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

afterAll(async () => {
  await context.gateway.disconnect();
});

describe('Store:privatedata Tests', () => {
  it('should createCommit', done => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, type } = store.getState().write;
      if (tx_id === tid && type === action.CREATE_SUCCESS) {
        const commit = values(result)[0];
        commitId = commit.commitId;
        expect(pick(commit, 'entityName', 'version', 'events')).toMatchSnapshot();
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
          events: [{ type: 'User Created', payload: { name: 'me' } }],
          collection
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
        args: { entityName, commitId, id: enrollmentId, collection },
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
        values<Commit>(result)
          .map(commit => pick(commit, 'entityName', 'version', 'events'))
          .map(commit => expect(commit).toMatchSnapshot());
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntityName({
        tx_id: tid,
        args: { entityName, collection },
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
        values<Commit>(result)
          .map(commit => pick(commit, 'entityName', 'version', 'events'))
          .map(commit => expect(commit).toMatchSnapshot());
        unsubscribe();
        done();
      }
    });
    store.dispatch(
      action.queryByEntityId({
        tx_id: tid,
        args: { entityName, id: enrollmentId, collection },
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
        args: { entityName, id: enrollmentId, commitId, collection },
        channelEventHub,
        connectionProfile,
        channelName,
        wallet
      })
    );
  });
});
