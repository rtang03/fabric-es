require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import omit from 'lodash/omit';
import values from 'lodash/values';
import { Redisearch } from 'redis-modules-sdk';
import rimraf from 'rimraf';
import { createQueryHandler, createQueryDatabase, createRedisRepository } from '..';
import { getNetwork } from '../../services';
import { getReducer } from '../../types';
import {
  Counter,
  CounterEvents,
  CounterInRedis,
  counterIndexDefinition as fields,
  OutputCounter,
  postSelector,
  preSelector,
  reducerCallback,
} from '../../unit-test-counter';
import { isCommit, waitForSecond } from '../../utils';
import type { OutputCommit, QueryHandler, RedisRepository } from '../types';

const reducer = getReducer(reducerCallback);
const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const caName = process.env.CA_NAME;
const channelName = process.env.CHANNEL_NAME;
const entityName = 'test_reconcile';
const connectionProfile = process.env.CONNECTION_PROFILE;
const id = `qh_test_001`;
const id2 = `qh_test_002`;
const mspId = process.env.MSPID;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const reducers = { [entityName]: reducer };
const walletPath = process.env.WALLET;

let client: Redisearch;
let queryHandler: QueryHandler;
let counterRedisRepo: RedisRepository<OutputCounter>;
let commitRepo: RedisRepository<OutputCommit>;

/**
 * ./dn-run.1-db-red-auth.sh
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
      connectionProfile,
      caName,
      mspId,
      wallet,
    });

    // Step 2: EnrollCaAdmin
    await enrollAdmin({
      enrollmentID: caAdmin,
      enrollmentSecret: caAdminPW,
      connectionProfile,
      caName,
      mspId,
      wallet,
    });

    // Step 3: connect Redis
    client = new Redisearch({ host: 'localhost', port: 6379 });
    await client.connect();

    // Step 4: create counter's RedisRepo
    counterRedisRepo = createRedisRepository<Counter, CounterInRedis, OutputCounter>({
      client,
      fields,
      entityName,
      postSelector,
      preSelector,
    });

    // Step 5: create QueryDatabase
    const queryDatabase = createQueryDatabase(client, { [entityName]: counterRedisRepo });
    commitRepo = queryDatabase.getRedisCommitRepo();

    // Step 6: obtain network configuration of Hyperledger Fabric
    const { gateway, network } = await getNetwork({
      discovery: true,
      asLocalhost: true,
      channelName,
      connectionProfile,
      wallet,
      enrollmentId: orgAdminId,
    });

    queryHandler = createQueryHandler({
      entityNames: [entityName],
      gateway,
      network,
      queryDatabase,
      connectionProfile,
      channelName,
      wallet,
      reducers,
    });

    // Step 7: prepare Redisearch indexes
    const eidx = counterRedisRepo.getIndexName();
    await counterRedisRepo
      .dropIndex()
      .then((result) => console.log(`${eidx} is dropped: ${result}`))
      .catch((result) => console.log(`${eidx} is not dropped: ${result}`));

    await counterRedisRepo
      .createIndex()
      .then((result) => console.log(`${eidx} is created: ${result}`))
      .catch((result) => {
        console.log(`${eidx} is not created: ${result}`);
        process.exit(1);
      });

    const cidx = commitRepo.getIndexName();
    await commitRepo
      .dropIndex()
      .then((result) => console.log(`${cidx} is dropped: ${result}`))
      .catch((result) => console.log(`${cidx} is not dropped: ${result}`));

    await commitRepo
      .createIndex()
      .then((result) => console.log(`${cidx} is created: ${result}`))
      .catch((result) => {
        console.log(`${cidx} is not created: ${result}`);
        process.exit(1);
      });

    // Step 8: remove pre-existing records
    await queryDatabase
      .clearNotifications({ creator: 'org1-admin' })
      .then(({ status }) => console.log(`clearNotifications: ${status}`));

    await queryHandler
      .command_deleteByEntityId(entityName)({ id })
      .then(({ data: { message } }) => console.log(message));

    await queryHandler
      .command_deleteByEntityId(entityName)({ id: id2 })
      .then(({ data: { message } }) => console.log(message));

    await queryHandler
      .query_deleteCommitByEntityName(entityName)()
      .then(({ data }) => console.log(`${data} record(s) deleted`));

    return waitForSecond(4);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  // tear down
  await queryHandler
    .clearNotifications({ creator: 'org1-admin' })
    .then(({ status }) => console.log(`clearNotifications: ${status}`));

  await queryHandler
    .command_deleteByEntityId(entityName)({ id })
    .then(({ data: { message } }) => console.log(message));

  await queryHandler
    .command_deleteByEntityId(entityName)({ id: id2 })
    .then(({ data: { message } }) => console.log(message));

  await queryHandler
    .query_deleteCommitByEntityName(entityName)()
    .then(({ data }) => console.log(`${data} record(s) deleted`));

  await client.disconnect();
  return waitForSecond(2);
});

describe('Reconcile Tests', () => {
  it('should create #1 record for id1', async () =>
    queryHandler
      .create<CounterEvents>(entityName)({ enrollmentId: orgAdminId, id })
      .save({
        events: [
          {
            type: 'Increment',
            payload: { id, desc: 'query handler #1 reconcile-test', tag: 'reconcile' },
          },
        ],
      })
      .then(({ data }) => omit(data, 'commitId', 'entityId', 'mspId'))
      .then((commit) => expect(commit).toEqual({ id, entityName, version: 0 })));

  // returns
  // [
  //   {
  //     id: 'qh_test_001',
  //     entityName: 'test_reconcile',
  //     version: 0,
  //     commitId: '20210209073042924',
  //     entityId: 'qh_test_001',
  //     mspId: 'Org1MSP',
  //     events: [ [Object] ]
  //   }
  // ]
  it('should command_getByEntityName', async () =>
    queryHandler
      .command_getByEntityName(entityName)()
      .then(({ data, status, error }) => {
        const commit = values(data)[0];
        expect(commit.entityName).toEqual(entityName);
        expect(commit.id).toEqual(id);
        expect(commit.version).toEqual(0);
        expect(status).toEqual('OK');
        expect(error).toBeUndefined();
      }));

  it('should fail to reconcile non-existing entityName', async () =>
    queryHandler
      .reconcile()({ entityName: 'Noop' })
      .then(({ data, status }) => {
        expect(data).toEqual([]);
        expect(status).toEqual('OK');
      }));

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual([{ key: 'e:test_reconcile:qh_test_001', status: 'OK' }]);
        expect(data.length).toEqual(1);
      }));

  it('should fail to query_getById: non-existing entityName', async () =>
    queryHandler
      .getById('noop')({ enrollmentId: orgAdminId, id })
      .then(({ currentState, save }) => {
        expect(currentState).toBeNull();
        expect(save).toBeNull();
      }));

  it('should fail to query_getById: non-existing entityId', async () =>
    queryHandler
      .getById(entityName)({ enrollmentId: orgAdminId, id: 'noop' })
      .then(({ currentState, save }) => {
        expect(currentState).toBeNull();
        expect(save).toBeNull();
      }));

  it('should query_getById, and add new event for id1', async () => {
    const { currentState, save } = await queryHandler.getById<Counter, CounterEvents>(entityName)({
      enrollmentId: orgAdminId,
      id,
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
    expect(data.id).toEqual(id);
    expect(data.entityName).toEqual(entityName);
    expect(data.version).toEqual(1);
  });

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual([{ key: 'e:test_reconcile:qh_test_001', status: 'OK' }]);
        expect(data.length).toEqual(1);
      }));

  // returns
  // {
  //   id: 'qh_test_001',
  //   desc: 'query handler #2 reconcile-test',
  //   tag: 'reconcile',
  //   value: 2,
  //   _ts: 1612857014,
  //   _created: 1612857007,
  //   _creator: 'admin-org1.net',
  //   _organization: [ 'Org1MSP' ]
  // }
  it('should query_getById for id1', async () =>
    queryHandler
      .getById<Counter, CounterEvents>(entityName)({ enrollmentId: orgAdminId, id })
      .then(({ currentState }) => {
        expect(currentState.id).toEqual(id);
        expect(currentState.value).toEqual(2);
        expect(currentState.desc).toEqual('query handler #2 reconcile-test');
        expect(currentState.tag).toEqual('reconcile');
      }));

  it('should fail to query_getByEntityName: non-existing entityName', async () =>
    queryHandler
      .getByEntityName<Counter>('noop')()
      .then(({ data }) => {
        expect(data).toEqual([]);
      }));

  it('should query_getByEntityName', async () =>
    queryHandler
      .getByEntityName<Counter>(entityName)()
      .then(({ data }) => data[0])
      .then((counter) => {
        expect(counter.id).toEqual(id);
        expect(counter.desc).toEqual('query handler #2 reconcile-test');
        expect(counter.tag).toEqual('reconcile');
        expect(counter.value).toEqual(2);
        expect(typeof counter._ts).toEqual('number');
      }));

  it('should create #2 record for id2', async () =>
    queryHandler
      .create<CounterEvents>(entityName)({ enrollmentId: orgAdminId, id: id2 })
      .save({
        events: [
          {
            type: 'Increment',
            payload: { id: id2, desc: 'query handler #3 reconcile-test', tag: 'reconcile' },
          },
        ],
      })
      .then(({ data }) => expect(isCommit(data)).toBeTruthy()));

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName })
      .then(({ data, status }) => {
        expect(data).toEqual([
          { key: 'e:test_reconcile:qh_test_001', status: 'OK' },
          { key: 'e:test_reconcile:qh_test_002', status: 'OK' },
        ]);
        expect(status).toEqual('OK');
        expect(data.length).toEqual(2);
      }));

  it('should query_getById for id2', async () =>
    queryHandler
      .getById<Counter, CounterEvents>(entityName)({ enrollmentId: orgAdminId, id: id2 })
      .then(({ currentState }) => {
        expect(currentState.id).toEqual(id2);
        expect(currentState.tag).toEqual('reconcile');
        expect(currentState.desc).toEqual('query handler #3 reconcile-test');
        expect(currentState.value).toEqual(1);
        expect(typeof currentState._ts).toEqual('number');
      }));

  it('should query_getByEntityName', async () =>
    queryHandler
      .getByEntityName<Counter>(entityName)()
      // both _ts and _created are real-clock variables
      .then(({ data }) => data.map<Partial<Counter>>((item) => omit(item, '_ts', '_created')))
      .then((counters) => {
        expect(counters).toEqual([
          {
            value: 2,
            id,
            tag: 'reconcile',
            desc: 'query handler #2 reconcile-test',
            _creator: 'admin-org1.net',
          },
          {
            value: 1,
            id: id2,
            tag: 'reconcile',
            desc: 'query handler #3 reconcile-test',
            _creator: 'admin-org1.net',
          },
        ]);
      }));

  it('should fail to query_getCommitById: non-existing entityName', async () =>
    queryHandler
      .getCommitById('noop')({ id })
      .then(({ data }) => expect(data).toEqual([])));

  it('should fail to query_getCommitById: non-existing entityid', async () =>
    queryHandler
      .getCommitById(entityName)({ id: 'noop' })
      .then(({ data }) => expect(data).toEqual([])));

  // returns
  // [
  //   {
  //     id: 'qh_test_001',
  //     entityName: 'test_reconcile',
  //     commitId: '20210209081416239',
  //     mspId: 'Org1MSP',
  //     creator: 'admin-org1.net',
  //     event: 'Increment',
  //     entityId: 'qh_test_001',
  //     version: 0,
  //     ts: 1612858454,
  //     events: [ [Object] ]
  //   },
  //   {
  //     id: 'qh_test_001',
  //     entityName: 'test_reconcile',
  //     commitId: '20210209081422441',
  //     mspId: 'Org1MSP',
  //     creator: '',
  //     event: 'Increment',
  //     entityId: 'qh_test_001',
  //     version: 1,
  //     ts: 1612858460,
  //     events: [ [Object] ]
  //   }
  // ]
  it('should query_getCommitById for id1', async () =>
    queryHandler
      .getCommitById(entityName)({ id })
      .then(({ data }) => data.map((item) => omit(item, 'commitId', 'events', 'ts')))
      .then((commits) => {
        expect(commits).toEqual([
          {
            id,
            entityName,
            version: 0,
            mspId: 'Org1MSP',
            creator: 'admin-org1.net',
            entityId: id,
            event: 'Increment',
          },
          {
            id,
            entityName,
            version: 1,
            mspId: 'Org1MSP',
            creator: '',
            entityId: id,
            event: 'Increment',
          },
        ]);
      }));

  it('should fail to query_deleteByEntityId for id1: non-existing entityName', async () =>
    queryHandler
      .query_deleteCommitByEntityId('noop')({ id })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual(0);
      }));

  it('should fail to query_deleteByEntityId for id1: non-existing entityId', async () =>
    queryHandler
      .query_deleteCommitByEntityId(entityName)({ id: 'noop' })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual(0);
      }));

  it('should query_deleteByEntityId for id1', async () =>
    queryHandler
      .query_deleteCommitByEntityId(entityName)({ id })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual(2);
      }));

  it('should query_deleteEntityByEntityName', async () =>
    queryHandler
      .query_deleteEntityByEntityName(entityName)()
      .then(({ status, data }) => {
        expect(status).toEqual('OK');
        expect(data).toEqual(2);
      }));
});
