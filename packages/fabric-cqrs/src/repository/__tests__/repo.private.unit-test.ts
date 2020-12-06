require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets } from 'fabric-network';
import omit from 'lodash/omit';
import rimraf from 'rimraf';
import { createPrivateRepository } from '..';
import { registerUser } from '../../account';
import { getNetwork } from '../../services';
import type { PrivateRepository } from '../../types';
import { Counter, CounterEvent, reducer } from '../../unit-test-reducer';
import { getLogger, isCommitRecord } from '../../utils';

/**
 * ./dn-run-1-px-db-red-auth.sh
 */

let wallet: Wallet;
let context;
let repo: PrivateRepository<Counter, CounterEvent>;
let commitId: string;

const entityName = 'test_private_repo';
const reducers = { [entityName]: reducer };
const enrollmentId = `repo_pd_tester_${Math.floor(Math.random() * 10000)}`;
const id = `repo_test_counter_002`;
const entityId = id;
const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const caName = process.env.CA_NAME;
const mspId = process.env.MSPID;
const logger = getLogger({ name: 'repo-unit.test.js' });
const events = [
  {
    type: 'Increment',
    payload: { id, desc: 'repo #1 create-test', tag: 'private-repo-test' },
  },
];

beforeAll(async () => {
  rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
  rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);

  wallet = await Wallets.newFileSystemWallet(process.env.WALLET);

  try {
    await enrollAdmin({
      connectionProfile,
      enrollmentID: process.env.ORG_ADMIN_ID,
      enrollmentSecret: process.env.ORG_ADMIN_SECRET,
      caName,
      mspId,
      wallet,
    });

    await enrollAdmin({
      connectionProfile,
      enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
      enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      caName,
      mspId,
      wallet,
    });

    await registerUser({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      caName,
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

    repo = createPrivateRepository<Counter, CounterEvent>(entityName, reducer, {
      gateway: context.gateway,
      network: context.network,
      channelName,
      connectionProfile,
      wallet,
      logger,
    });

    // tear up
    const { data } = await repo.getCommitByEntityName();

    if (isCommitRecord(data)) {
      for await (const [_, { id, commitId }] of Object.entries(data)) {
        await repo
          .deleteByEntityIdCommitId({ id, commitId })
          .then(({ data }) => console.log(data))
          .catch((e) => console.error(e));
      }
    }
  } catch (e) {
    console.error('Bootstrap network error');
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  repo.disconnect();
  return new Promise((done) => setTimeout(() => done(), 3000));
});

describe('Private Repository Test - Part 1', () => {
  it('should get entityName', async () => repo.getEntityName() === entityName);

  it('should Increment #1', async () =>
    repo
      .create({ enrollmentId, id })
      .save({ events })
      .then(({ data, status }) => {
        expect(status).toEqual('OK');
        expect(data.id).toEqual(id);
        expect(data.entityName).toEqual(entityName);
        expect(data.version).toEqual(0);
        commitId = data.commitId;
      }));
});

describe('Private Repository Test - Part 2', () => {
  beforeEach(() => new Promise((resolve) => setTimeout(() => resolve(), 2000)));

  it('should getByEntityName', async () =>
    repo.getCommitByEntityName().then(({ data, status }) => {
      const commit = data[0];
      expect(status).toEqual('OK');
      expect(commit.id).toEqual(id);
      expect(commit.entityName).toEqual(entityName);
      expect(commit.version).toEqual(0);
    }));

  it('should queryByEntityIdCommitId', async () =>
    repo.getCommitByEntityIdCommitId({ id, commitId }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data[0].id).toEqual(id);
      expect(data[0].entityName).toEqual(entityName);
      expect(data[0].version).toEqual(0);
    }));

  it('should getById', async () => {
    const { currentState, save } = await repo.getById({
      enrollmentId,
      id,
    });

    expect(omit(currentState, '_ts', '_created', '_creator')).toEqual({
      _organization: ['Org1MSP'],
      value: 1,
      id: 'repo_test_counter_002',
      desc: 'repo #1 create-test',
      tag: 'private_repo_test',
    });

    return save({ events }).then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data.id).toEqual(id);
      expect(data.entityName).toEqual(entityName);
      expect(data.version).toEqual(1);
    });
  });

  it('should getByEntityName with 2 commits returned', async () =>
    repo.getCommitByEntityName().then(({ data, status }) => {
      expect(status).toEqual('OK');
      expect(data.length).toEqual(2);
      expect(
        (data as any).map((commit) => omit(commit, 'ts', 'events', 'hash', 'commitId', 'mspId'))
      ).toEqual([
        { id, entityName, version: 0, entityId },
        { id, entityName, version: 1, entityId },
      ]);
    }));

  it('should getById with value = 2', async () =>
    repo
      .getById({ enrollmentId, id })
      .then(({ currentState }) => expect(currentState.value).toEqual(2)));
});
