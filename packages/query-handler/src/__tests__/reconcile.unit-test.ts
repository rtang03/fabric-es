require('dotenv').config({ path: './env.test' });
import { getNetwork } from '@fabric-es/fabric-cqrs';
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';
import rimraf from 'rimraf';
import { registerUser } from '../account';
import { createQueryDatabase, createQueryHandler } from '../utils';

const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const caUrl = process.env.ORG_CA_URL;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const ordererName = process.env.ORDERER_NAME;
const ordererTlsCaCert = process.env.ORDERER_TLSCA_CERT;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const peerName = process.env.PEER_NAME;
const walletPath = process.env.WALLET;
const enrollmentId = `peer_test${Math.floor(Math.random() * 10000)}`;

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

    await registerUser({
      caAdmin,
      caAdminPW,
      fabricNetwork,
      enrollmentId,
      enrollmentSecret: 'password',
      connectionProfile,
      wallet,
      mspId,
    });

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

    const queryHandler = await createQueryHandler({
      gateway: networkConfig.gateway,
      queryDatabase,
      connectionProfile,
      channelName,
      wallet,
    });

    // create 5 on change records

    await queryHandler.reconcile()({ entityName: '', reducer: null });

  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  return new Promise((done) => setTimeout(() => done(), 1000));
});

describe('Reconcile Tests', async () => {
  it('should reconcile', async () => {});
});
