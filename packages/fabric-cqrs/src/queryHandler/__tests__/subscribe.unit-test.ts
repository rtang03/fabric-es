require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';
import omit from 'lodash/omit';
import rimraf from 'rimraf';
import {
  commitIndex,
  CounterEvent,
  createQueryDatabase,
  createQueryHandler,
  dummyReducer,
  entityIndex,
} from '..';
import { getNetwork } from '../../services';
import type { Commit, QueryHandler } from '../../types';
import { Counter } from '../../unit-test-reducer';
import { isCommit, isCommitRecord } from '../../utils';

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
const entityName = 'test_subscribe';
const id = `qh_sub_test_001`;
const enrollmentId = orgAdminId;
const reducers = { [entityName]: dummyReducer };
let redis: Redis.Redis;

let queryHandler: QueryHandler;

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

    queryHandler = createQueryHandler({
      entityNames: [entityName],
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
      .command_deleteByEntityId(entityName)({ id })
      .then(({ data }) => console.log(data.message))
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });

    await queryHandler
      .query_deleteByEntityName(entityName)()
      .then(({ data }) => console.log(`${data} record(s) deleted`));

    await queryHandler.subscribeHub([entityName]);

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

    return new Promise((done) => setTimeout(() => done(), 3000));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  queryHandler.unsubscribeHub();

  // clean up
  await redis
    .send_command('FT.DROP', ['cidx'])
    .then((result) => console.log(`cidx is dropped: ${result}`))
    .catch((result) => console.log(`cidx is not dropped: ${result}`));

  await redis
    .send_command('FT.DROP', ['eidx'])
    .then((result) => console.log(`eidx is dropped: ${result}`))
    .catch((result) => console.log(`eidx is not dropped: ${result}`));

  await queryHandler
    .query_deleteByEntityName(entityName)()
    .then(({ data }) => console.log(`${data} records deleted`))
    .catch((error) => console.log(error));

  return new Promise((done) => setTimeout(() => done(), 1000));
});

describe('Query Handler Tests', () => {
  it('should create #1 record for id', async () =>
    queryHandler
      .create<CounterEvent>(entityName)({ enrollmentId, id })
      .save({
        events: [
          {
            type: 'Increment',
            payload: { id, desc: 'query handler #1 sub-test', tag: 'subcription' },
          },
        ],
      })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should query_getCommitById', async () =>
    queryHandler
      .getCommitById(entityName)({ id })
      .then(({ data }) => {
        data.forEach((commit) => {
          expect(commit.entityName).toEqual(entityName);
          expect(commit.id).toEqual(id);
          expect(isCommit(commit)).toBeTruthy();
        });
      }));

  it('should create #2 record for id', async () =>
    queryHandler
      .create<CounterEvent>(entityName)({ enrollmentId, id })
      .save({
        events: [
          {
            type: 'Decrement',
            payload: { id, desc: 'query hander #2 sub-test', tag: 'subscription' },
          },
        ],
      })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should FT.SEARCH by test* : return 2 commit', async () => {
    await new Promise((done) => setTimeout(() => done(), 3000));
    return queryHandler
      .fullTextSearchCommit()({ query: 'test*' })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(Object.keys(data).length).toEqual(2);
        expect(isCommitRecord(data)).toBeTruthy();
      });
  });

  it('should FT.SEARCH by qh* : return 2 commits', async () =>
    queryHandler
      .fullTextSearchCommit()({ query: 'qh*' })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(Object.keys(data).length).toEqual(2);
        expect(isCommitRecord(data)).toBeTruthy();
      }));

  it('should FT.SEARCH by @event:{increment} : return 1 commit', async () =>
    queryHandler
      .fullTextSearchCommit()({ query: '@event:{increment}' })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(Object.values<Commit>(data)[0].events[0].type).toEqual('Increment');
        expect(Object.keys(data).length).toEqual(1);
        expect(isCommitRecord(data)).toBeTruthy();
      }));

  it('should fail to FT.SEARCH: invalid input;', async () =>
    queryHandler
      .fullTextSearchCommit()({ query: 'kljkljkljjkljklj;jkl;' })
      .then(({ data, status, error }) => {
        expect(status).toEqual('ERROR');
        expect(data).toBeNull();
        expect(error).toContain('Syntax error at offset');
      }));

  it('should FT.SEARCH by test* : return 1 entity', async () =>
    queryHandler
      .fullTextSearchEntity<Counter>()({ query: 'test*' })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        const counter = Object.values(data)[0];
        const key = Object.keys(data)[0];
        expect(key).toEqual(`${entityName}::${id}`);
        expect(omit(counter, 'ts')).toEqual({ id, value: 0 });
      }));
});
