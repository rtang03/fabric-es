require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';
import omit from 'lodash/omit';
import values from 'lodash/values';
import rimraf from 'rimraf';
import { commitIndex, createQueryDatabase, createQueryHandler, entityIndex } from '..';
import { isCommitRecord } from '../..';
import type { Commit, QueryHandler } from '../../../types';
import { getNetwork } from '../../services';
import { reducer } from '../../unit-test-reducer';

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
const reducers = { [entityName]: reducer };

let queryHandler: QueryHandler;
let redis: Redis.Redis;

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
    redis = new Redis();

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
      reducers,
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

    await redis
      .send_command('FT.DROP', ['cidx'])
      .then((result) => console.log(`cidx is dropped: ${result}`))
      .catch((result) => console.log(`cidx is not dropped: ${result}`));

    await redis
      .send_command('FT.CREATE', commitIndex)
      .then((result) => console.log(`cidx is created: ${result}`))
      .catch((result) => console.log(`cidx is not created: ${result}`));

    await redis
      .send_command('FT.DROP', ['eidx'])
      .then((result) => console.log(`eidx is dropped: ${result}`))
      .catch((result) => console.log(`eidx is not dropped: ${result}`));

    await redis
      .send_command('FT.CREATE', entityIndex)
      .then((result) => console.log(`eidx is created: ${result}`))
      .catch((result) => console.log(`eidx is not created: ${result}`));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  await redis
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`eidx is dropped: ${result}`))
    .catch((result) => console.log(`eidx is not dropped: ${result}`));

  await queryHandler
    .query_deleteByEntityName()({ entityName })
    .then((data) => console.log(`${data} records deleted`))
    .catch((error) => console.log(error));

  return new Promise((done) => setTimeout(() => done(), 1000));
});

describe('Reconcile Tests', () => {
  it('should create #1 record for id1', async () =>
    queryHandler
      .command_create({ entityName, enrollmentId, id })
      .save({
        events: [
          {
            type: 'Increment',
            payload: { id, desc: 'query handler #1 reconcile-test', tag: 'reconcile' },
          },
        ],
      })
      .then(({ data }) => omit(values<Commit>(data)[0], 'commitId', 'entityId'))
      .then((commit) => expect(commit).toEqual({ id, entityName, version: 0 })));

  it('should command_getByEntityName', async () =>
    queryHandler
      .command_getByEntityName()({ entityName })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should fail to reconcile non-existing entityName', async () =>
    queryHandler
      .reconcile()({ entityName: 'Noop', reducer })
      .then(({ data, status }) => {
        expect(data).toBeNull();
        expect(status).toEqual('OK');
      }));

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName, reducer })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual([{ key: 'test_reconcile::qh_test_001', status: 'OK' }]);
        expect(data.length).toEqual(1);
      }));

  it('should fail to query_getById: non-existing entityName', async () =>
    queryHandler
      .query_getById({ enrollmentId, id, entityName: 'noop', reducer })
      .then(({ currentState, save }) => {
        expect(currentState).toBeNull();
        expect(save).toBeNull();
      }));

  it('should fail to query_getById: non-existing entityId', async () =>
    queryHandler
      .query_getById({ enrollmentId, entityName, id: 'noop', reducer })
      .then(({ currentState, save }) => {
        expect(currentState).toBeNull();
        expect(save).toBeNull();
      }));

  it('should query_getById, and add new event for id1', async () => {
    const { currentState, save } = await queryHandler.query_getById({
      enrollmentId,
      id,
      entityName,
      reducer,
    });
    expect(currentState.value).toEqual(1);
    expect(currentState.id).toEqual(id);
    expect(currentState.desc).toEqual('query handler #1 reconcile-test');
    expect(currentState.tag).toEqual('reconcile');

    const { data } = await save({
      events: [
        {
          type: 'Increment',
          payload: { id, desc: 'query handler #2 reconcile-test', tag: 'reconcile' },
        },
      ],
    });
    const commit = Object.values(data)[0];
    expect(isCommitRecord(data)).toBeTruthy();
    expect(commit.id).toEqual(id);
    expect(commit.entityName).toEqual(entityName);
    expect(commit.version).toEqual(1);
  });

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName, reducer })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual([{ key: 'test_reconcile::qh_test_001', status: 'OK' }]);
        expect(data.length).toEqual(1);
      }));

  it('should query_getById for id1', async () =>
    queryHandler
      .query_getById({ enrollmentId, id, entityName, reducer })
      .then(({ currentState }) => {
        expect(currentState.id).toEqual(id);
        expect(currentState.value).toEqual(2);
        expect(currentState.desc).toEqual('query handler #2 reconcile-test');
        expect(currentState.tag).toEqual('reconcile');
      }));

  it('should fail to query_getByEntityName: non-existing entityName', async () =>
    queryHandler
      .query_getByEntityName({ entityName })({ entityName: 'noop' })
      .then(({ data }) => {
        expect(data).toBeNull();
      }));

  it('should query_getByEntityName', async () =>
    queryHandler
      .query_getByEntityName({ entityName })({ entityName })
      .then(({ data }) => data.currentStates[0])
      .then((entity) => {
        expect(entity.id).toEqual(id);
        expect(entity.desc).toEqual('query handler #2 reconcile-test');
        expect(entity.tag).toEqual('reconcile');
        expect(entity.value).toEqual(2);
        expect(typeof entity.ts).toEqual('number');
      }));

  it('should create #2 record for id2', async () =>
    queryHandler
      .command_create({ entityName, enrollmentId, id: id2 })
      .save({
        events: [
          {
            type: 'Increment',
            payload: { id: id2, desc: 'query handler #3 reconcile-test', tag: 'reconcile' },
          },
        ],
      })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName, reducer })
      .then(({ data, status }) => {
        expect(data).toEqual([
          { key: 'test_reconcile::qh_test_001', status: 'OK' },
          { key: 'test_reconcile::qh_test_002', status: 'OK' },
        ]);
        expect(status).toEqual('OK');
        expect(data.length).toEqual(2);
      }));

  it('should query_getById for id2', async () =>
    queryHandler
      .query_getById({ enrollmentId, id: id2, entityName, reducer })
      .then(({ currentState }) => {
        expect(currentState.id).toEqual(id2);
        expect(currentState.tag).toEqual('reconcile');
        expect(currentState.desc).toEqual('query handler #3 reconcile-test');
        expect(currentState.value).toEqual(1);
        expect(typeof currentState.ts).toEqual('number');
      }));

  it('should query_getByEntityName', async () =>
    queryHandler
      .query_getByEntityName({ entityName })({ entityName })
      .then<any[]>(({ data }) => data.currentStates.map((item) => omit(item, 'ts')))
      .then((currentStates) => {
        expect(currentStates).toEqual([
          { value: 2, id, tag: 'reconcile', desc: 'query handler #2 reconcile-test' },
          { value: 1, id: id2, tag: 'reconcile', desc: 'query handler #3 reconcile-test' },
        ]);
      }));

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
      .then(({ data }) => data.map((item) => omit(item, 'commitId', 'events', 'entityId')))
      .then((commits) => {
        expect(commits).toEqual([
          { id, entityName, version: 1 },
          { id, entityName, version: 0 },
        ]);
      }));

  it('should fail to query_deleteByEntityId for id1: non-existing entityName', async () =>
    queryHandler
      .query_deleteByEntityId()({ id, entityName: 'noop' })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual(0);
      }));

  it('should fail to query_deleteByEntityId for id1: non-existing entityId', async () =>
    queryHandler
      .query_deleteByEntityId()({ entityName, id: 'noop' })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual(0);
      }));

  it('should query_deleteByEntityId for id1', async () =>
    queryHandler
      .query_deleteByEntityId()({ id, entityName })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual(2);
      }));
});
