require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets } from 'fabric-network';
import values from 'lodash/values';
import { Store } from 'redux';
import rimraf from 'rimraf';
import { registerUser } from '../../../account';
import { getNetwork } from '../../../services';
import type { Commit, FabricResponse } from '../../../types';
import { dispatcher, getLogger, isCommitRecord } from '../../../utils';
import { action } from '../action';
import { getStore } from './__utils__/store';

let context: any;
let commitId: string;
let store: Store;
const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const entityName = 'store_privatedata';
const enrollmentId = `store_privatedata${Math.floor(Math.random() * 1000)}`;
const id = `command_test_counter_002`;
const logger = getLogger({ name: 'command.private.integration.ts' });
const events = [
  {
    type: 'Increment',
    payload: { id, desc: 'store #1 command-test', tag: 'command-test' },
  },
];

let wallet: Wallet;

beforeAll(async () => {
  try {
    rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
    rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);

    wallet = await Wallets.newFileSystemWallet(process.env.WALLET);

    await enrollAdmin({
      caUrl: process.env.ORG_CA_URL,
      connectionProfile,
      enrollmentID: process.env.ORG_ADMIN_ID,
      enrollmentSecret: process.env.ORG_ADMIN_SECRET,
      fabricNetwork,
      mspId,
      wallet,
    });

    await enrollAdmin({
      caUrl: process.env.ORG_CA_URL,
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
      discovery: false,
      asLocalhost: !(process.env.NODE_ENV === 'production'),
    });

    context.logger = logger;

    store = getStore(context);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

afterAll(async () => {
  rimraf.sync(`${process.env.WALLET}/${enrollmentId}.id`);
  context.gateway.disconnect();
  return new Promise((done) => setTimeout(() => done(), 5000));
});

// failure tests are not required.

describe('Store:privatedata Tests', () => {
  it('should createCommit', async () =>
    dispatcher<Record<string, Commit>, { events: any[] }>(
      ({ tx_id, args: { events } }) =>
        action.create({
          tx_id,
          connectionProfile,
          channelName,
          wallet,
          enrollmentId,
          args: { entityName, id, version: 0, events, isPrivateData: true },
        }),
      {
        name: 'create',
        slice: 'write',
        store,
        logger,
        SuccessAction: action.CREATE_SUCCESS,
        ErrorAction: action.CREATE_ERROR,
        typeGuard: isCommitRecord,
      }
    )({ events }).then(({ status, data }) => {
      expect(status).toEqual('OK');
      expect(isCommitRecord(data)).toBeTruthy();
      const commit = values(data)[0];
      expect(commit.entityName).toEqual(entityName);
      expect(commit.id).toEqual(id);
      expect(commit.version).toEqual(0);
      commitId = commit.commitId;
    }));

  it('should queryByEntityIdCommitId', async () =>
    dispatcher<Record<string, Commit>, { id: string; commitId: string }>(
      ({ tx_id, args: { id, commitId } }) =>
        action.queryByEntIdCommitId({
          tx_id,
          wallet,
          channelName,
          connectionProfile,
          enrollmentId,
          args: { id, commitId, entityName, isPrivateData: true },
        }),
      {
        SuccessAction: action.QUERY_SUCCESS,
        ErrorAction: action.QUERY_ERROR,
        logger,
        name: 'queryByEntityIdCommitId',
        slice: 'write',
        store,
        typeGuard: isCommitRecord,
      }
    )({ id, commitId }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(isCommitRecord(data)).toBeTruthy();
      const commit = values(data)[0];
      expect(commit.entityName).toEqual(entityName);
      expect(commit.id).toEqual(id);
      expect(commit.version).toEqual(0);
    }));

  it('should queryByEntityName', async () =>
    dispatcher<Record<string, Commit>, null>(
      ({ tx_id }) =>
        action.queryByEntityName({
          tx_id,
          wallet,
          connectionProfile,
          channelName,
          enrollmentId,
          args: { entityName, isPrivateData: true },
        }),
      {
        SuccessAction: action.QUERY_SUCCESS,
        ErrorAction: action.QUERY_ERROR,
        logger,
        name: 'queryByEntityName',
        slice: 'write',
        store,
        typeGuard: isCommitRecord,
      }
    )().then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(isCommitRecord(data)).toBeTruthy();
      const commit = values(data)[0];
      expect(commit.entityName).toEqual(entityName);
      expect(commit.id).toEqual(id);
      expect(commit.version).toEqual(0);
    }));

  it('should queryByEntityId', async () =>
    dispatcher<Record<string, Commit>, { id: string }>(
      ({ tx_id, args: { id } }) =>
        action.queryByEntityId({
          tx_id,
          wallet,
          connectionProfile,
          channelName,
          enrollmentId,
          args: { id, entityName, isPrivateData: true },
        }),
      {
        SuccessAction: action.QUERY_SUCCESS,
        ErrorAction: action.QUERY_ERROR,
        logger,
        name: 'queryByEntityId',
        slice: 'write',
        store,
      }
    )({ id }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(isCommitRecord(data)).toBeTruthy();
      const commit = values(data)[0];
      expect(commit.entityName).toEqual(entityName);
      expect(commit.id).toEqual(id);
      expect(commit.version).toEqual(0);
    }));

  it('should deleteByEntityIdCommitId', async () =>
    dispatcher<FabricResponse, { id: string; commitId: string }>(
      ({ tx_id, args: { id, commitId } }) =>
        action.deleteByEntityIdCommitId({
          tx_id,
          wallet,
          channelName,
          connectionProfile,
          enrollmentId,
          args: { entityName, id, commitId, isPrivateData: true },
        }),
      {
        SuccessAction: action.DELETE_SUCCESS,
        ErrorAction: action.DELETE_ERROR,
        logger,
        name: 'deleteByEntityIdCommitId',
        slice: 'write',
        store,
      }
    )({ id, commitId }).then(({ data, status, error }) => {
      expect(status).toEqual('OK');
      expect(data?.status).toEqual('SUCCESS');
      expect(error).toBeUndefined();
    }));

  it('should fail to deleteByEntityIdCommitId: already deleted', async () =>
    dispatcher<FabricResponse, { id: string; commitId: string }>(
      ({ tx_id, args: { id, commitId } }) =>
        action.deleteByEntityIdCommitId({
          tx_id,
          wallet,
          channelName,
          connectionProfile,
          enrollmentId,
          args: { entityName, id, commitId, isPrivateData: true },
        }),
      {
        SuccessAction: action.DELETE_SUCCESS,
        ErrorAction: action.DELETE_ERROR,
        logger,
        name: 'deleteByEntityIdCommitId',
        slice: 'write',
        store,
      }
    )({ id, commitId }).then(({ data, status, error }) => {
      expect(status).toEqual('ERROR');
      expect(error).toContain('commitId does not exist');
    }));
});
