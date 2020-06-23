require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets } from 'fabric-network';
import Redis from 'ioredis';
import omit from 'lodash/omit';
import values from 'lodash/values';
import rimraf from 'rimraf';
import { createRepository } from '..';
import { registerUser } from '../../account';
import {
  createQueryHandler,
  createQueryDatabase,
  commitIndex,
  entityIndex,
} from '../../queryHandler';
import { getNetwork } from '../../services';
import type { QueryHandler, Repository } from '../../types';
import { reducer, CounterEvent, Counter } from '../../unit-test-reducer';
import { getLogger, isCommitRecord, waitForSecond } from '../../utils';

/**
 * ./dn-run.1-px-db-red-auth.sh
 */

let wallet: Wallet;
let context;
let queryHandler: QueryHandler;
let redis: Redis.Redis;
let repo: Repository<Counter, CounterEvent>;
let commitId: string;

const entityName = 'test_repo';
const reducers = { [entityName]: reducer };
const enrollmentId = `repo_tester_${Math.floor(Math.random() * 10000)}`;
const id = `repo_test_counter_001`;
const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const caUrl = process.env.ORG_CA_URL;
const logger = getLogger({ name: 'repo-unit.test.js' });
const events = [
  {
    type: 'Increment',
    payload: { id, desc: 'repo #1 create-test', tag: 'repo-test' },
  },
];

beforeAll(async () => {
  rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
  rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);

  wallet = await Wallets.newFileSystemWallet(process.env.WALLET);
  // localhost:6379
  redis = new Redis();
  const queryDatabase = createQueryDatabase(redis);

  try {
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

    queryHandler = createQueryHandler({
      entityNames: [entityName],
      queryDatabase,
      connectionProfile,
      channelName,
      wallet,
      gateway: context.gateway,
      network: context.network,
      reducers,
      logger,
    });

    repo = createRepository<Counter, CounterEvent>(entityName, reducer, {
      queryDatabase,
      gateway: context.gateway,
      network: context.network,
      channelName,
      connectionProfile,
      wallet,
      logger,
    });

    // invoke contract listener
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

    await repo.command_deleteByEntityId({ id }).then(({ status }) => console.log(status));
  } catch (e) {
    console.error('Bootstrap network error');
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

  await repo
    .query_deleteByEntityName()
    .then(({ data, status }) =>
      console.log(`${entityName}: ${data} record(s) deleted, status: ${status}`)
    );

  repo.disconnect();

  queryHandler.unsubscribeHub();
  return new Promise((done) => setTimeout(() => done(), 3000));
});

describe('Repository Test', () => {
  it('should get entityName', async () => repo.getEntityName() === entityName);

  it('should command_deleteByEntityId', async () =>
    repo.command_deleteByEntityId({ id }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data?.status).toEqual('SUCCESS');
    }));

  it('should query_deleteByEntityId', async () =>
    repo.query_deleteByEntityId({ id }).then(({ status }) => {
      expect(status).toEqual('OK');
    }));

  it('should command_create', async () => {
    await repo
      .create({ enrollmentId, id })
      .save({ events })
      .then(({ data, status }) => {
        const commit = values(data)[0];
        expect(status).toEqual('OK');
        expect(isCommitRecord(data)).toBeTruthy();
        expect(commit.id).toEqual(id);
        expect(commit.entityName).toEqual(entityName);
        expect(commit.version).toEqual(0);
        commitId = commit.commitId;
      });

    return waitForSecond(10);
  });

  it('should verify result by command_getByEntityIdCommitId', async () =>
    repo.command_getByEntityIdCommitId({ id, commitId }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(isCommitRecord(data)).toBeTruthy();
      expect(values(data)[0].entityName).toEqual(entityName);
      expect(values(data)[0].id).toEqual(id);
      expect(values(data)[0].version).toEqual(0);
    }));

  it('should query_getByEntityName', async () =>
    repo.getByEntityName().then(({ data, status }) => {
      const counter = omit(data[0], 'ts');
      expect(status).toEqual('OK');
      expect(counter).toEqual({
        value: 1,
        id: 'repo_test_counter_001',
        desc: 'repo #1 create-test',
        tag: 'repo-test',
      });
    }));

  it('should query_getCommitById', async () =>
    repo.getCommitById({ id }).then(({ data, status }) => {
      expect(data.length).toEqual(1);
      expect(data[0].commitId).toEqual(commitId);
      const commit = data[0];
      expect(status).toEqual('OK');
      expect(commit.id).toEqual(id);
      expect(commit.entityName).toEqual(entityName);
      expect(commit.version).toEqual(0);
    }));

  it('should getById, and then save new event', async () => {
    const { save, currentState } = await repo.getById({ enrollmentId, id });

    expect(omit(currentState, 'ts')).toEqual({
      __organization: ['Org1MSP'],
      value: 1,
      id: 'repo_test_counter_001',
      desc: 'repo #1 create-test',
      tag: 'repo-test',
    });

    await save({
      events: [
        {
          type: 'Increment',
          payload: { id, desc: 'repo #2 create-test', tag: 'repo-test' },
        },
      ],
    }).then(({ status, data }) => {
      const commit = values(data)[0];
      expect(status).toEqual('OK');
      expect(isCommitRecord(data)).toBeTruthy();
      expect(commit.id).toEqual(id);
      expect(commit.entityName).toEqual(entityName);
      expect(commit.version).toEqual(1);
    });
  });
});

describe('Verify Result', () => {
  beforeAll(() => new Promise((done) => setTimeout(() => done(), 10000)));

  it('should verify result by getById, after #2 commit', async () =>
    repo.getById({ enrollmentId, id }).then(({ currentState: { value, desc } }) => {
      expect(value).toEqual(2);
      expect(desc).toEqual('repo #2 create-test');
    }));

  it('should verify result by query_getCommitById, after #2 commit', async () =>
    repo.getCommitById({ id }).then(({ data, status }) => {
      values(data)
        .map((commit) => omit(commit, 'ts'))
        .forEach((commit) => {
          expect(commit.id).toEqual(id);
          expect(commit.entityName).toEqual(entityName);
        });
      expect(data.length).toEqual(2);
      expect(status).toEqual('OK');
    }));

  it('should verify result by query_getByEntityName, after #2 commit', async () =>
    repo.getByEntityName().then(({ data, status }) => {
      const counter = values(data)[0];
      expect(status).toEqual('OK');
      expect(omit(counter, 'ts')).toEqual({
        value: 2,
        id: 'repo_test_counter_001',
        desc: 'repo #2 create-test',
        tag: 'repo-test',
      });
    }));

  it('should find by entityId', async () =>
    repo.find({ byId: id }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      const counter = values(data)[0];
      expect(omit(counter, 'ts')).toEqual({
        __organization: ['Org1MSP'],
        value: 2,
        id: 'repo_test_counter_001',
        desc: 'repo #2 create-test',
        tag: 'repo-test',
      });
    }));

  it('should find by desc with wildcard', async () =>
    repo.find({ byDesc: 'repo*' }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      const counter = values(data)[0];
      expect(omit(counter, 'ts')).toEqual({
        __organization: ['Org1MSP'],
        value: 2,
        id: 'repo_test_counter_001',
        desc: 'repo #2 create-test',
        tag: 'repo-test',
      });
    }));

  it('should find by entityId, and desc with wildcard', async () =>
    repo.find({ byId: id, byDesc: 'repo*' }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      const counter = values(data)[0];
      expect(omit(counter, 'ts')).toEqual({
        __organization: ['Org1MSP'],
        value: 2,
        id: 'repo_test_counter_001',
        desc: 'repo #2 create-test',
        tag: 'repo-test',
      });
    }));

  it('should fail find by where: invalid id', async () =>
    repo.find({ where: { id: 'abcdec' } }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data.length).toEqual(0);
    }));

  it('should find by where', async () =>
    repo.find({ where: { id } }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      const counter = values(data)[0];
      expect(omit(counter, 'ts')).toEqual({
        __organization: ['Org1MSP'],
        value: 2,
        id: 'repo_test_counter_001',
        desc: 'repo #2 create-test',
        tag: 'repo-test',
      });
    }));
});
