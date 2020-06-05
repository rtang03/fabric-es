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

let context;
let commitId: string;
let store: Store;
const entityName = 'command_test';
const enrollmentId = `command_test${Math.floor(Math.random() * 10000)}`;
const id = `command_test_counter_001`;
const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const caUrl = process.env.ORG_CA_URL;
const logger = getLogger({ name: 'command.integration.ts' });
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
  return new Promise((done) => setTimeout(() => done(), 5000));
});

describe('Store/command: failure tests', () => {
  it('should deleteByEntityId (tear up)', async () =>
    dispatcher<FabricResponse, { id: string }>(
      ({ tx_id, args: { id } }) =>
        action.deleteByEntityId({
          tx_id,
          channelName,
          connectionProfile,
          wallet,
          args: { id, entityName, isPrivateData: false },
        }),
      {
        ErrorAction: action.DELETE_ERROR,
        SuccessAction: action.DELETE_SUCCESS,
        logger,
        name: 'deleteByEntityId',
        slice: 'write',
        store,
      }
    )({ id }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data.status).toEqual('SUCCESS');
    }));

  it('should queryByEntityName with no result returned', async () =>
    dispatcher<Record<string, Commit>, null>(
      ({ tx_id }) =>
        action.queryByEntityName({
          tx_id,
          wallet,
          connectionProfile,
          channelName,
          enrollmentId,
          args: { entityName, isPrivateData: false },
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
      expect(data).toEqual({});
    }));

  it('should fail to queryByEntityName: invalid argument', async () =>
    dispatcher<Record<string, Commit>, null>(
      ({ tx_id }) =>
        action.queryByEntityName({
          tx_id,
          wallet,
          connectionProfile,
          channelName,
          enrollmentId,
          args: { entityName: null, isPrivateData: false },
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
    )().then(({ data, status, error }) => {
      expect(status).toEqual('ERROR');
      expect(data).toBeNull();
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to queryByEntityIdCommitId: invalid argument', async () =>
    dispatcher<Record<string, Commit>, { id: string; commitId: string }>(
      ({ tx_id, args: { id, commitId } }) =>
        action.queryByEntIdCommitId({
          tx_id,
          wallet,
          channelName,
          connectionProfile,
          enrollmentId,
          args: { id, commitId, entityName, isPrivateData: false },
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
    )({ id, commitId: null }).then(({ data, status, error }) => {
      expect(status).toEqual('ERROR');
      expect(data).toBeNull();
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to queryByEntityId: no result returned', async () =>
    dispatcher<Record<string, Commit>, { id: string }>(
      ({ tx_id, args: { id } }) =>
        action.queryByEntityId({
          tx_id,
          wallet,
          connectionProfile,
          channelName,
          enrollmentId,
          args: { id, entityName, isPrivateData: false },
        }),
      {
        SuccessAction: action.QUERY_SUCCESS,
        ErrorAction: action.QUERY_ERROR,
        logger,
        name: 'queryByEntityId',
        slice: 'write',
        store,
      }
    )({ id }).then(({ data, status, error }) => {
      expect(status).toEqual('OK');
      expect(data).toEqual({});
      expect(error).toBeUndefined();
    }));

  it('should fail to queryByEntityId: invalid argument', async () =>
    dispatcher<Record<string, Commit>, { id: string }>(
      ({ tx_id, args: { id } }) =>
        action.queryByEntityId({
          tx_id,
          wallet,
          connectionProfile,
          channelName,
          enrollmentId,
          args: { id, entityName, isPrivateData: false },
        }),
      {
        SuccessAction: action.QUERY_SUCCESS,
        ErrorAction: action.QUERY_ERROR,
        logger,
        name: 'queryByEntityId',
        slice: 'write',
        store,
      }
    )({ id: null }).then(({ data, status, error }) => {
      expect(status).toEqual('ERROR');
      expect(data).toBeNull();
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to deleteByEntityIdCommitId: invalid argument', async () =>
    dispatcher<FabricResponse, { id: string; commitId: string }>(
      ({ tx_id, args: { id, commit } }) =>
        action.deleteByEntityIdCommitId({
          tx_id,
          wallet,
          channelName,
          connectionProfile,
          enrollmentId,
          args: { entityName, id, commitId, isPrivateData: false },
        }),
      {
        SuccessAction: action.DELETE_SUCCESS,
        ErrorAction: action.DELETE_ERROR,
        logger,
        name: 'deleteByEntityIdCommitId',
        slice: 'write',
        store,
      }
    )({ id, commitId: null }).then(({ data, status, error }) => {
      expect(status).toEqual('ERROR');
      expect(data).toBeNull();
      expect(error).toContain('invalid input argument');
    }));

  it('should fail to create: invalid argument', async () =>
    dispatcher<Record<string, Commit>, { events: any[] }>(
      ({ tx_id, args: { events } }) =>
        action.create({
          tx_id,
          connectionProfile,
          channelName,
          wallet,
          enrollmentId,
          args: { entityName, id, version: 0, events, isPrivateData: false },
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
    )({ events: null }).then(({ status, data, error }) => {
      expect(status).toEqual('ERROR');
      expect(data).toBeNull();
      expect(error).toContain('invalid input argument');
    }));
});

describe('CQRS - command Tests', () => {
  it('should create', async () =>
    dispatcher<Record<string, Commit>, { events: any[] }>(
      ({ tx_id, args: { events } }) =>
        action.create({
          tx_id,
          connectionProfile,
          channelName,
          wallet,
          enrollmentId,
          args: { entityName, id, version: 0, events, isPrivateData: false },
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
          args: { id, commitId, entityName, isPrivateData: false },
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
          args: { entityName, isPrivateData: false },
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
          args: { id, entityName, isPrivateData: false },
        }),
      {
        SuccessAction: action.QUERY_SUCCESS,
        ErrorAction: action.QUERY_ERROR,
        logger,
        name: 'queryByEntityId',
        slice: 'write',
        store,
        typeGuard: isCommitRecord,
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
      ({ tx_id, args: { id, commit } }) =>
        action.deleteByEntityIdCommitId({
          tx_id,
          wallet,
          channelName,
          connectionProfile,
          enrollmentId,
          args: { entityName, id, commitId, isPrivateData: false },
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
      ({ tx_id, args: { id, commit } }) =>
        action.deleteByEntityIdCommitId({
          tx_id,
          wallet,
          channelName,
          connectionProfile,
          enrollmentId,
          args: { entityName, id, commitId, isPrivateData: false },
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
      expect(data?.message).toEqual('commitId does not exist');
      expect(error).toBeUndefined();
    }));
});
