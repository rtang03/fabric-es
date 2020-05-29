require('dotenv').config({ path: './.env.test' });
import { Commit, getNetwork } from '@fabric-es/fabric-cqrs';
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';
import rimraf from 'rimraf';
import type { QueryHandler } from '../types';
import {
  commitIndex,
  createQueryDatabase,
  createQueryHandler,
  isCommit,
  isCommitRecord,
} from '../utils';

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
      .then(({ data }) => console.log(data.message))
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });

    await queryHandler
      .query_deleteByEntityName()({ entityName })
      .then(({ data }) => console.log(data.message));

    await queryHandler.subscribeHub();

    await redis
      .send_command('FT.DROP', ['cidx'])
      .then((result) => console.log(`commitIndex is dropped: ${result}`))
      .catch((result) => console.error(`commitIndex is not dropped: ${result}`));

    await redis
      .send_command('FT.CREATE', commitIndex)
      .then((result) => console.log(`commitIndex is created: ${result}`))
      .catch((result) => console.error(`commitIndex is not created: ${result}`));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  queryHandler.unsubscribeHub();
  return new Promise((done) => setTimeout(() => done(), 1000));
});

describe('Query Handler Tests', () => {
  it('should create #1 record for id', async () =>
    queryHandler
      .command_create({ entityName, enrollmentId, id })
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
      .query_getCommitById()({ id, entityName })
      .then(({ data }) => {
        data.forEach((commit) => {
          expect(commit.entityName).toEqual(entityName);
          expect(commit.id).toEqual(id);
          expect(isCommit(commit)).toBeTruthy();
        });
      }));

  it('should create #2 record for id', async () =>
    queryHandler
      .command_create({ entityName, enrollmentId, id })
      .save({
        events: [
          {
            type: 'Decrement',
            payload: { id, desc: 'query hander #2 sub-test', tag: 'subscription' },
          },
        ],
      })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should FT.SEARCH by test*', async () => {
    await new Promise((done) => setTimeout(() => done(), 3000));
    return queryHandler.commitFTSearch({ query: 'test*' }).then(({ data }) => {
      expect(Object.keys(data).length).toEqual(2);
      expect(isCommitRecord(data)).toBeTruthy();
    });
  });

  it('should FT.SEARCH by qh*', async () =>
    queryHandler.commitFTSearch({ query: 'qh*' }).then(({ data }) => {
      expect(Object.keys(data).length).toEqual(2);
      expect(isCommitRecord(data)).toBeTruthy();
    }));

  it('should FT.SEARCH by @event:{increment}', async () =>
    queryHandler.commitFTSearch({ query: '@event:{increment}' }).then(({ data }) => {
      expect(Object.values<Commit>(data)[0].events[0].type).toEqual('Increment');
      expect(Object.keys(data).length).toEqual(1);
      expect(isCommitRecord(data)).toBeTruthy();
    }));

  it('should fail to FT.SEARCH: invalid ;', async () =>
    queryHandler
      .commitFTSearch({ query: 'kljkljkljjkljklj;jkl;' })
      .then(({ data, status, error }) => {
        expect(status).toEqual('ERROR');
        expect(data).toBeNull();
        expect(error.message).toContain('Syntax error at offset');
      }));
});
