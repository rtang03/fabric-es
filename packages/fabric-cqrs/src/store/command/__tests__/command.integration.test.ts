import { getLogger } from '../../../utils';

require('../../../env');
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets } from 'fabric-network';
import { pick, values } from 'lodash';
import { Store } from 'redux';
import rimraf from 'rimraf';
import { registerUser } from '../../../account';
import { getNetwork } from '../../../services';
import { PeerOptions } from '../../../types';
import { generateToken } from '../../utils';
import { action } from '../action';
import { getStore } from './__utils__/store';

let context;
let commitId: string;
let store: Store;
const entityName = 'command_test';
const enrollmentId = `command_test${Math.floor(Math.random() * 1000)}`;
const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const caUrl = process.env.ORG_CA_URL;
const logger = getLogger({ name: 'command.integration.ts' });

let wallet: Wallet;

beforeAll(async () => {
  try {
    rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
    rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);

    wallet = await Wallets.newFileSystemWallet(process.env.WALLET);

    await enrollAdmin({
      caUrl,
      connectionProfile,
      enrollmentID: process.env.ORG_ADMIN_ID,
      enrollmentSecret: process.env.ORG_ADMIN_SECRET,
      fabricNetwork,
      mspId,
      wallet,
    });

    await enrollAdmin({
      caUrl,
      connectionProfile,
      enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
      enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      fabricNetwork,
      mspId,
      wallet,
    });

    await registerUser({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      fabricNetwork,
      enrollmentId,
      enrollmentSecret: 'password',
      connectionProfile,
      wallet,
      mspId,
    });

    context = await getNetwork({
      channelName,
      connectionProfile,
      wallet,
      enrollmentId,
      discovery: true,
      asLocalhost: true,
    });

    context.logger = logger;

    store = getStore(context);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(() => {
  rimraf.sync(`${process.env.WALLET}/${enrollmentId}.id`);
  context.gateway.disconnect();
});

describe('CQRS - command Tests', () => {
  // tear-up
  it('should deleteByEntityId', (done) => {
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
        args: { entityName, id: enrollmentId, isPrivateData: false },
        connectionProfile,
        channelName,
        wallet,
      })
    );
  });

  it('should createEntity', (done) => {
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
          events: [{ type: 'User Created', payload: { name: 'me' } }],
          isPrivateData: false,
        },
        // Special attention: createAction will be based on newly created account (given below
        // enrollmentId; to using a new Fabric contract, to submit transaction, and based on its x509
        // cert. Other actions does not require to supply enrollmentId, and will keep using admin ecert
        enrollmentId,
        connectionProfile,
        channelName,
        wallet,
      })
    );
  });

  it('should queryByEntityIdCommitId', (done) => {
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
        args: { entityName, commitId, id: enrollmentId, isPrivateData: false },
        connectionProfile,
        channelName,
        wallet,
      })
    );
  });

  it('should queryByEntityName', (done) => {
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
        args: { entityName, isPrivateData: false },
        connectionProfile,
        channelName,
        wallet,
      })
    );
  });

  it('should queryByEntityId', (done) => {
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
        args: { entityName, id: enrollmentId, isPrivateData: false },
        connectionProfile,
        channelName,
        wallet,
      })
    );
  });

  it('should deleteByEntityIdCommitId', (done) => {
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
        args: { entityName, id: enrollmentId, commitId, isPrivateData: false },
        connectionProfile,
        channelName,
        wallet,
      })
    );
  });
});
