require('dotenv').config({ path: './.env.test' });
import { getNetwork } from '@fabric-es/fabric-cqrs';
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';
import rimraf from 'rimraf';
import type { QueryHandler } from '../types';
import { createQueryDatabase, createQueryHandler, isCommit, isCommitRecord } from '../utils';
import { reducer } from './__utils__';

const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const caUrl = process.env.ORG_CA_URL;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const walletPath = process.env.WALLET;
const entityName = 'test_reconcile';
const id = `qh_test_001`;
const id2 = `qh_test_002`;
const enrollmentId = orgAdminId;

let queryHandler: QueryHandler;

/**
 * ./dn-run-1-px-db-red-auth.sh
 */

beforeAll(async () => {
  rimraf.sync(`${walletPath}/${orgAdminId}.id`);
  rimraf.sync(`${walletPath}/${caAdmin}.id`);

  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Step 1: EnrollAdmin
    await enrollAdmin({
      enrollmentID: orgAdminId,
      enrollmentSecret: orgAdminSecret,
      caUrl,
      connectionProfile,
      fabricNetwork,
      mspId,
      wallet,
    });

    // Step 2: EnrollCaAdmin
    await enrollAdmin({
      enrollmentID: caAdmin,
      enrollmentSecret: caAdminPW,
      caUrl,
      connectionProfile,
      fabricNetwork,
      mspId,
      wallet,
    });

    // localhost:6379
    const redis = new Redis();

    const queryDatabase = createQueryDatabase(redis);

    const networkConfig = await getNetwork({
      discovery: true,
      asLocalhost: true,
      channelName,
      connectionProfile,
      wallet,
      enrollmentId,
    });

    queryHandler = await createQueryHandler({
      gateway: networkConfig.gateway,
      network: networkConfig.network,
      queryDatabase,
      connectionProfile,
      channelName,
      wallet,
    });

    // tear down
    await queryHandler
      .command_deleteByEntityId()({ entityName, id })
      .then(({ data }) => console.log(data.message));

    await queryHandler
      .command_deleteByEntityId()({ entityName, id: id2 })
      .then(({ data }) => console.log(data.message));

    await queryHandler
      .query_deleteByEntityName()({ entityName })
      .then(({ data }) => console.log(data.message));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => new Promise((done) => setTimeout(() => done(), 1000)));

describe('Reconcile Tests', () => {
  it('should create #1 record for id1', async () =>
    queryHandler
      .command_create({ entityName, enrollmentId, id })
      .save({ events: [{ type: 'Increment', payload: { counterId: id, timestamp: Date.now() } }] })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should command_getByEntityName', async () =>
    queryHandler
      .command_getByEntityName()({ entityName })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should fail to reconcile non-existing entityName', async () =>
    queryHandler
      .reconcile()({ entityName: 'Noop', reducer })
      .then(({ data }) => {
        expect(data.status).toEqual('OK');
        expect(data.message).toEqual('no commit record exists');
      }));

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName, reducer })
      .then(({ data }) => {
        expect(data.status).toEqual('OK');
        expect(data.result.length > 0).toBeTruthy();
      }));

  it('should fail to query_getById: non-existing entityName', async () =>
    queryHandler.query_getById({ enrollmentId, id, entityName: 'noop', reducer }).then(({ currentState, save }) => {
      expect(currentState).toBeNull();
      expect(save).toBeNull();
    }));

  it('should fail to query_getById: non-existing entityName', async () =>
    queryHandler.query_getById({ enrollmentId, entityName, id: 'noop', reducer }).then(({ currentState, save }) => {
      expect(currentState).toBeNull();
      expect(save).toBeNull();
    }));

  it('should query_getById, and add new event for id1', async () => {
    const { currentState, save } = await queryHandler.query_getById({ enrollmentId, id, entityName, reducer });
    expect(currentState).toEqual({ value: 1, counterId: id });

    const { data } = await save({ events: [{ type: 'Increment', payload: { counterId: id, timestamp: Date.now() } }] });
    const commit = Object.values(data)[0];
    expect(isCommitRecord(data)).toBeTruthy();
    expect(commit.id).toEqual(id);
    expect(commit.entityName).toEqual(entityName);
    expect(commit.version).toEqual(1);
  });

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName, reducer })
      .then(({ data }) => {
        expect(data.status).toEqual('OK');
        expect(data.result.length > 0).toBeTruthy();
      }));

  it('should query_getById for id1', async () =>
    queryHandler
      .query_getById({ enrollmentId, id, entityName, reducer })
      .then(({ currentState }) => expect(currentState).toEqual({ value: 2, counterId: id })));

  it('should fail to query_getByEntityName: non-existing entityName', async () =>
    queryHandler
      .query_getByEntityName({ reducer })({ entityName: 'noop' })
      .then(({ data }) => {
        expect(data.currentStates).toEqual([]);
        expect(data.errors).toEqual([]);
      }));

  it('should query_getByEntityName', async () =>
    queryHandler
      .query_getByEntityName({ reducer })({ entityName })
      .then(({ data }) => expect(data.currentStates).toEqual([{ value: 2, counterId: id }])));

  it('should create #2 record for id2', async () =>
    queryHandler
      .command_create({ entityName, enrollmentId, id: id2 })
      .save({ events: [{ type: 'Increment', payload: { counterId: id2, timestamp: Date.now() } }] })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName, reducer })
      .then(({ data }) => {
        expect(data.status).toEqual('OK');
        expect(data.result.length > 0).toBeTruthy();
      }));

  it('should query_getById for id2', async () =>
    queryHandler
      .query_getById({ enrollmentId, id: id2, entityName, reducer })
      .then(({ currentState }) => expect(currentState).toEqual({ value: 1, counterId: id2 })));

  it('should query_getByEntityName', async () =>
    queryHandler
      .query_getByEntityName({ reducer })({ entityName })
      .then(({ data }) =>
        expect(data.currentStates).toEqual([
          { value: 2, counterId: id },
          { value: 1, counterId: id2 },
        ])
      ));

  it('should fail to query_getCommitById: non-existing entityName', async () =>
    queryHandler
      .query_getCommitById()({ id, entityName: 'noop' })
      .then(({ data }) => expect(data).toEqual([])));

  it('should fail to query_getCommitById: non-existing entityid', async () =>
    queryHandler
      .query_getCommitById()({ entityName, id: 'noop' })
      .then(({ data }) => expect(data).toEqual([])));

  it('should query_getCommitById for id1', async () =>
    queryHandler
      .query_getCommitById()({ id, entityName })
      .then(({ data }) => {
        data.forEach((commit) => {
          expect(commit.entityName).toEqual(entityName);
          expect(commit.id).toEqual(id);
          expect(isCommit(commit)).toBeTruthy();
        });
      }));

  it('should fail to query_deleteByEntityId for id1: non-existing entityName', async () =>
    queryHandler
      .query_deleteByEntityId()({ id, entityName: 'noop' })
      .then(({ data }) => {
        expect(data.status).toEqual('OK');
        expect(data.result).toEqual(0);
      }));

  it('should fail to query_deleteByEntityId for id1: non-existing entityId', async () =>
    queryHandler
      .query_deleteByEntityId()({ entityName, id: 'noop' })
      .then(({ data }) => {
        expect(data.status).toEqual('OK');
        expect(data.result).toEqual(0);
      }));

  it('should query_deleteByEntityId for id1', async () =>
    queryHandler
      .query_deleteByEntityId()({ id, entityName })
      .then(({ data }) => {
        expect(data.status).toEqual('OK');
        expect(data.result).toEqual(2);
      }));
});
