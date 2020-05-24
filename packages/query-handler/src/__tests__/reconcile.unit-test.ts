require('dotenv').config({ path: './.env.test' });
import { getNetwork } from '@fabric-es/fabric-cqrs';
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';
import rimraf from 'rimraf';
import type { QueryHandler } from '../types';
import { createQueryDatabase, createQueryHandler, isCommitRecord } from '../utils';
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
// const id = `peer_test${Math.floor(floorMath.random() * 10000)}`;
const id = `qh_test_001`;
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
      .then(({ data }) => console.log(data));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  return new Promise((done) => setTimeout(() => done(), 1000));
});

describe('Reconcile Tests', () => {
  it('should create first record', async () =>
    queryHandler
      .command_create({ entityName, enrollmentId, id })
      .save({ events: [{ type: 'Increment', payload: { timestamp: Date.now() } }] })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should queryByEntity', async () =>
    queryHandler
      .command_queryByEntityName()({ entityName })
      .then(({ data }) => expect(isCommitRecord(data)).toBeTruthy()));

  it('should reconcile', async () =>
    queryHandler
      .reconcile()({ entityName, reducer })
      .then((result) => console.log(result)));
});
