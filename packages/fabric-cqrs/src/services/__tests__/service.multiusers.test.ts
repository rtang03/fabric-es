require('../../env');
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets } from 'fabric-network';
import { values } from 'lodash';
import rimraf from 'rimraf';
import { registerUser } from '../../account';
import { Commit, PeerOptions } from '../../types';
import { evaluate } from '../evaluate';
import { getNetwork } from '../network';
import { submit } from '../submit';

let contextOrg1: Partial<PeerOptions>;
let contextOrg2: Partial<PeerOptions>;
let createdCommit_1: Commit;
const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const fabricNetwork = process.env.NETWORK_LOCATION;
const entityName = 'dev_multiusers_test';
const identityOrg1 = `org1user_test${Math.floor(Math.random() * 1000)}`;
const identityOrg2 = `org2user_test${Math.floor(Math.random() * 1000)}`;
let walletOrg1: Wallet;
let walletOrg2: Wallet;

beforeAll(async () => {
  try {
    rimraf.sync(`${process.env.ORG1_WALLET}/${process.env.ORG1_ADMIN_ID}.id`);
    rimraf.sync(`${process.env.ORG2_WALLET}/${process.env.ORG2_ADMIN_ID}.id`);
    rimraf.sync(`${process.env.ORG1_WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);
    rimraf.sync(`${process.env.ORG2_WALLET}/${process.env.ORG2_CA_ENROLLMENT_ID_ADMIN}.id`);
    walletOrg1 = await Wallets.newFileSystemWallet(process.env.ORG1_WALLET);
    walletOrg2 = await Wallets.newFileSystemWallet(process.env.ORG2_WALLET);

    // Org1
    await enrollAdmin({
      caUrl: process.env.ORG_CA_URL,
      connectionProfile,
      enrollmentID: process.env.ORG_ADMIN_ID,
      enrollmentSecret: process.env.ORG_ADMIN_SECRET,
      fabricNetwork,
      mspId: process.env.MSPID,
      wallet: walletOrg1
    });

    await enrollAdmin({
      caUrl: process.env.ORG_CA_URL,
      connectionProfile,
      enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
      enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      mspId: process.env.MSPID,
      fabricNetwork,
      wallet: walletOrg1
    });

    await registerUser({
      enrollmentId: identityOrg1,
      enrollmentSecret: 'password',
      connectionProfile: process.env.CONNECTION_PROFILE,
      fabricNetwork,
      wallet: walletOrg1,
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      mspId: process.env.MSPID
    });

    contextOrg1 = await getNetwork({
      channelName,
      enrollmentId: identityOrg1,
      connectionProfile,
      wallet: walletOrg1,
      discovery: true,
      asLocalhost: true
    });

    // Org2
    await enrollAdmin({
      caUrl: process.env.ORG2_ORG_CA_URL,
      connectionProfile: process.env.ORG2_CONNECTION_PROFILE,
      enrollmentID: process.env.ORG2_ORG_ADMIN_ID,
      enrollmentSecret: process.env.ORG2_ORG_ADMIN_SECRET,
      mspId: process.env.ORG2_MSPID,
      fabricNetwork,
      wallet: walletOrg2
    });

    await enrollAdmin({
      caUrl: process.env.ORG2_ORG_CA_URL,
      connectionProfile: process.env.ORG2_CONNECTION_PROFILE,
      enrollmentID: process.env.ORG2_CA_ENROLLMENT_ID_ADMIN,
      enrollmentSecret: process.env.ORG2_CA_ENROLLMENT_SECRET_ADMIN,
      mspId: process.env.ORG2_MSPID,
      fabricNetwork,
      wallet: walletOrg2
    });

    await registerUser({
      enrollmentId: identityOrg2,
      enrollmentSecret: 'password',
      connectionProfile: process.env.ORG2_CONNECTION_PROFILE,
      fabricNetwork,
      wallet: walletOrg2,
      caAdmin: process.env.ORG2_CA_ENROLLMENT_ID_ADMIN,
      caAdminPW: process.env.ORG2_CA_ENROLLMENT_SECRET_ADMIN,
      mspId: process.env.ORG2_MSPID
    });

    contextOrg2 = await getNetwork({
      channelName,
      enrollmentId: identityOrg2,
      connectionProfile: process.env.ORG2_CONNECTION_PROFILE,
      wallet: walletOrg2,
      discovery: true,
      asLocalhost: true
    });

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

afterAll(async () => {
  rimraf.sync(`${process.env.ORG1_WALLET}/${identityOrg1}.id`);
  rimraf.sync(`${process.env.ORG2_WALLET}/${identityOrg2}.id`);
  contextOrg1.gateway.disconnect();
  contextOrg2.gateway.disconnect();
});

describe('Multi-org Tests', () => {
  it('should createCommit at A; query at B ', async () => {
    // create at org1
    await submit(
      'eventstore:createCommit',
      [entityName, identityOrg1, '0', JSON.stringify([{ type: 'Created', payload: { name: 'me' } }])],
      { network: contextOrg1.network }
    )
      .then(result => values(result)[0])
      .then(commit => (createdCommit_1 = commit));

    const timer = new Promise(done => {
      setTimeout(() => done(), 2000);
    });
    await timer;

    // query at org2
    await evaluate(
      'eventstore:queryByEntityIdCommitId',
      [entityName, identityOrg1, createdCommit_1.commitId],
      {
        network: contextOrg2.network
      },
      false
    )
      .then(result => values(result)[0])
      .then(({ id, entityName }) => {
        expect(id).toBe(identityOrg1);
        expect(entityName).toBe(entityName);
      });
  });
});
