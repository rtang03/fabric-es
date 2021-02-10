import omit from 'lodash/omit';

require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import { Redisearch } from 'redis-modules-sdk';
import rimraf from 'rimraf';
import { createQueryDatabaseV2, createQueryHandlerV2, createRedisRepository } from '..';
import { getNetwork } from '../../services';
import {
  Counter,
  CounterEvent,
  reducer,
  counterSearchDefinition as fields,
  CounterInRedis,
  postSelector,
  preSelector,
  OutputCounter,
} from '../../unit-test-reducer';
import { isCommit, isCommitRecord, waitForSecond } from '../../utils';
import type { QueryHandlerV2, RedisRepository, OutputCommit } from '../types';
import { commit, commits, newCommit } from './__utils__';

/**
 * ./dn-run.1-db-red-auth.sh
 */

const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const caName = process.env.CA_NAME;
const mspId = process.env.MSPID;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const walletPath = process.env.WALLET;
const entityName = 'test_subscribe';
const id = `qh_sub_test_001`;
const timestampesOnCreate = [];
const reducers = { [entityName]: reducer };

let queryHandler: QueryHandlerV2;
let client: Redisearch;
let commitRepo: RedisRepository<OutputCommit>;
let counterRedisRepo: RedisRepository<OutputCounter>;

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
    client = new Redisearch({
      host: '127.0.0.1',
      port: 6379,
      retryStrategy: (times) => {
        if (times > 3) {
          // the 4th return will exceed 10 seconds, based on the return value...
          console.error(`Redis: connection retried ${times} times, exceeded 10 seconds.`);
          process.exit(-1);
        }
        return Math.min(times * 100, 3000); // reconnect after (ms)
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return 1;
        }
      },
    });
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
    const queryDatabase = createQueryDatabaseV2(client, { [entityName]: counterRedisRepo });
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

    queryHandler = createQueryHandlerV2({
      entityNames: [entityName],
      gateway,
      network,
      queryDatabase,
      connectionProfile,
      channelName,
      wallet,
      reducers,
    });

    await queryHandler.subscribeHub([entityName]);

    // Step 7: prepare Redisearch indexes
    const eidx = counterRedisRepo.getIndexName();
    await counterRedisRepo
      .dropIndex()
      .then((result) => console.log(`${eidx} is dropped: ${result}`))
      .catch((result) => console.log(`${eidx} is not dropped: ${result}`));

    await counterRedisRepo
      .createIndex()
      .then((result) => console.log(`${eidx} is created: ${result}`));

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
      .clearNotifications({ creator: 'admin-org1.net' })
      .then(({ status }) => console.log(`clearNotifications: ${status}`));

    await queryHandler
      .command_deleteByEntityId(entityName)({ id })
      .then(({ data: { message } }) => console.log(message));

    await queryHandler
      .query_deleteCommitByEntityName(entityName)()
      .then(({ data }) => console.log(`${data} record(s) deleted`));

    await queryHandler
      .query_deleteEntityByEntityName(entityName)()
      .then(({ data }) => console.log(`${data} record(s) deleted`));

    return waitForSecond(5);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  queryHandler.unsubscribeHub();
  await waitForSecond(10);
  return client.disconnect();
});

describe('Query Handler Tests', () => {
  // will create these keys
  // 1) "e:test_subscribe:qh_sub_test_001"
  // 2) "n:admin-org1.net:test_subscribe:qh_sub_test_001:20210210032205925"
  // 3) "c:test_subscribe:qh_sub_test_001:20210210032205925"
  it('should create #1 record for id', async () => {
    await queryHandler
      .create<CounterEvent>(entityName)({ enrollmentId: orgAdminId, id })
      .save({
        events: [
          {
            type: 'Increment',
            payload: { id, desc: 'query handler #1 sub-test', tag: 'subcription' },
          },
        ],
      })
      .then(({ data, status }) => {
        expect(status).toBe('OK');
        expect(isCommit(data)).toBeTruthy();
      });
    // await mergeEntity
    return waitForSecond(2);
  });

  // returns
  // [
  //   {
  //     id: 'qh_sub_test_001',
  //     entityName: 'test_subscribe',
  //     commitId: '20210210033651668',
  //     mspId: 'Org1MSP',
  //     creator: 'admin-org1.net',
  //     event: 'Increment',
  //     entityId: 'qh_sub_test_001',
  //     version: 0,
  //     ts: 1612928210,
  //     events: [ [Object] ]
  //   }
  // ]
  it('should query_getCommitById', async () =>
    queryHandler
      .getCommitById(entityName)({ id })
      .then(({ data, status }) => {
        expect(status).toBe('OK');
        data.forEach((commit) => {
          expect(commit.entityName).toEqual(entityName);
          expect(commit.id).toEqual(id);
          expect(isCommit(commit)).toBeTruthy();
        });
      }));

  // will create these keys
  // 1) "c:test_subscribe:qh_sub_test_001:20210210035257594"
  // 2) "n:admin-org1.net:test_subscribe:qh_sub_test_001:20210210035257594"
  // 3) "c:test_subscribe:qh_sub_test_001:20210210035250191"
  // 4) "e:test_subscribe:qh_sub_test_001"
  // 5) "n:admin-org1.net:test_subscribe:qh_sub_test_001:20210210035250191"
  it('should create #2 record for id', async () => {
    await queryHandler
      .create<CounterEvent>(entityName)({ enrollmentId: orgAdminId, id })
      .save({
        events: [
          {
            type: 'Decrement',
            payload: { id, desc: 'query hander #2 sub-test', tag: 'subscription' },
          },
        ],
      })
      .then(({ data, status }) => {
        expect(status).toBe('OK');
        expect(isCommit(data)).toBeTruthy();
      });
    return waitForSecond(2);
  });

  // returns
  // {
  //   status: 'OK',
  //   data: {
  //     total: 2,
  //     items: [ [Object], [Object] ],
  //     hasMore: false,
  //     cursor: 2
  //   }
  // }
  it('should FT.SEARCH by qh* : return 2 commits', async () =>
    queryHandler
      .fullTextSearchCommit({ query: 'qh*', cursor: 0, pagesize: 2 })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(2);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(2);
        expect(isCommitRecord(data.items)).toBeTruthy();
      }));

  // returns
  // {
  //   total: 1,
  //     items: [
  //   {
  //     id: 'qh_sub_test_001',
  //     entityName: 'test_subscribe',
  //     commitId: '20210210093740270',
  //     mspId: 'Org1MSP',
  //     creator: 'admin-org1.net',
  //     event: 'Increment',
  //     entityId: 'qh_sub_test_001',
  //     version: 0,
  //     ts: 1612949858,
  //     events: [Array]
  //   }
  // ],
  //   hasMore: false,
  //   cursor: 1
  // }
  it('should FT.SEARCH by @event:{increment} : return 1 commit', async () =>
    queryHandler
      .fullTextSearchCommit({ query: '@event:{increment}', cursor: 0, pagesize: 2 })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(1);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(1);
        expect(data.items[0].events[0].type).toEqual('Increment');
        expect(isCommitRecord(data.items)).toBeTruthy();
      }));

  // returns
  // {
  //   total: 2,
  //     items: [
  //   {
  //     id: 'qh_sub_test_001',
  //     entityName: 'test_subscribe',
  //     commitId: '20210210100536268',
  //     mspId: 'Org1MSP',
  //     creator: 'admin-org1.net',
  //     event: 'Increment',
  //     entityId: 'qh_sub_test_001',
  //     version: 0,
  //     ts: 1612951534,
  //     events: [Array]
  //   },
  //   {
  //     id: 'qh_sub_test_001',
  //     entityName: 'test_subscribe',
  //     commitId: '20210210100543718',
  //     mspId: 'Org1MSP',
  //     creator: 'admin-org1.net',
  //     event: 'Decrement',
  //     entityId: 'qh_sub_test_001',
  //     version: 0,
  //     ts: 1612951542,
  //     events: [Array]
  //   }
  // ],
  //   hasMore: false,
  //   cursor: 2
  // }
  // note: @mspId is tag, is case sensitive
  it('should FT.SEARCH by @mspId:{org1msp} : return 2 commit', async () =>
    queryHandler
      .fullTextSearchCommit({ query: '@mspId:{org1msp}', cursor: 0, pagesize: 2 })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(2);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(2);
        expect(data.items[0].mspId).toEqual('Org1MSP');
        expect(isCommitRecord(data.items)).toBeTruthy();
      }));

  it('should fail to FT.SEARCH: invalid input;', async () =>
    queryHandler
      .fullTextSearchCommit({ query: 'kljkljkljjkljklj;jkl;', cursor: 0, pagesize: 2 })
      .then(({ data, status, error, message }) => {
        expect(status).toEqual('ERROR');
        expect(data).toBeUndefined();
        expect(error.message).toContain('Syntax error at offset');
      }));

  // returns OutputCounter
  // {
  //   total: 1,
  //     items: [
  //   {
  //     createdAt: '2021-02-10T13:02:21.000Z',
  //     creator: 'admin-org1.net',
  //     description: 'query hander #2 sub-test',
  //     eventInvolved: [Array],
  //     id: 'qh_sub_test_001',
  //     tags: [Array],
  //     timestamp: '2021-02-10T13:02:28.000Z',
  //     value: '0'
  //   }
  // ],
  //   hasMore: false,
  //   cursor: 1
  // }
  it('should FT.SEARCH by test* : return 1 entity', async () =>
    queryHandler
      .fullTextSearchEntity<OutputCounter>({ entityName, query: 'test*', cursor: 0, pagesize: 2 })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.total).toEqual(1);
        expect(data.hasMore).toBeFalsy();
        expect(data.cursor).toEqual(1);
        expect(omit(data.items[0], 'createdAt', 'timestamp')).toEqual({
          id,
          value: 0,
          tags: ['subscription'],
          description: 'query hander #2 sub-test',
          creator: 'admin-org1.net',
          eventInvolved: ['Increment', 'Decrement'],
        });
      }));


});
