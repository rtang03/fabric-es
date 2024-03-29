require('dotenv').config({ path: './.env.dev' });
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets, Gateway, Network } from 'fabric-network';
import values from 'lodash/values';
import rimraf from 'rimraf';
import { evaluate, getNetwork, submitPrivateData } from '..';
import { registerUser } from '../../account';
import type { Commit } from '../../types';

/**
 * ./dn-run-1-px-db-red-auth.sh
 *  OR
 *  ./dn-run.2-px-db-red-auth.sh
 */

let network: Network;
let gateway: Gateway;
let wallet: Wallet;
let createdCommit_1: Commit;
let createdCommit_2: Commit;

const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const caName = process.env.CA_NAME;
const mspId = process.env.MSPID;
const entityName = 'dev_test_privatedata';
const transient = {
  eventstr: Buffer.from(JSON.stringify([{ type: 'Created', payload: { name: 'me' } }])),
};
const enrollmentId = `service_privatedata${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  try {
    rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
    rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);

    wallet = await Wallets.newFileSystemWallet(process.env.WALLET);

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

    const context = await getNetwork({
      channelName,
      connectionProfile,
      wallet,
      enrollmentId,
      discovery: false,
      asLocalhost: true,
    });
    network = context.network;
    gateway = context.gateway;
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  rimraf.sync(`${process.env.WALLET}/${enrollmentId}.id`);
  gateway.disconnect();
  return new Promise<void>((ok) => setTimeout(() => ok(), 2000));
});

describe('Event store Tests: Privatedata', () => {
  it('should createCommit #1', async () =>
    submitPrivateData('privatedata:createCommit', [entityName, enrollmentId, '0'], transient, {
      network,
    })
      .then<Commit>((result) => values(result)[0])
      .then((commit) => {
        createdCommit_1 = commit;
        return expect(commit.entityId).toEqual(enrollmentId);
      }));

  it('should createCommit #2', async () =>
    submitPrivateData('privatedata:createCommit', [entityName, enrollmentId, '0'], transient, {
      network,
    })
      .then<Commit>((result) => values(result)[0])
      .then((commit) => (createdCommit_2 = commit)));

  it('should queryByEntityId #1', async () =>
    evaluate('privatedata:queryByEntityId', [entityName, enrollmentId], {
      network,
    }).then((result) => values(result).map((commit) => expect(commit.id).toEqual(enrollmentId))));

  it('should queryByEntityName', async () =>
    evaluate('privatedata:queryByEntityName', [entityName], { network }).then((result) =>
      values(result).map((commit) => expect(commit.entityName).toEqual(entityName))
    ));

  it('should deleteByEntityIdCommitId #1', async () =>
    submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [entityName, enrollmentId, createdCommit_1.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should fail to deleteByEntityIdCommitId', async () =>
    submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [entityName, enrollmentId, createdCommit_1.commitId],
      null,
      { network }
    ).then(({ error }) =>
      expect(error.message.startsWith('No valid responses from any peers')).toBeTruthy()
    ));

  it('should deleteByEntityIdCommitId #2', async () =>
    submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [entityName, enrollmentId, createdCommit_2.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));
});
