require('../../env');
import { FileSystemWallet } from 'fabric-network';
import { values } from 'lodash';
import { registerUser } from '../../account';
import { PeerOptions } from '../../types';
import { Commit, toCommit } from '../../types/commit'; // do not shorten it
import { evaluate } from '../evaluate';
import { getNetwork } from '../network';
import { submit } from '../submit';
import {
  enrollOrg1Admin,
  enrollOrg1CaAdmin,
  enrollOrg2Admin,
  enrollOrg2CaAdmin
} from './__utils__';

let contextOrg1: Partial<PeerOptions>;
let contextOrg2: Partial<PeerOptions>;
let createdCommit_1: Commit;
const entityName = 'dev_multiusers_test';
const identityOrg1 = `org1user_test${Math.floor(Math.random() * 1000)}`;
const identityOrg2 = `org2user_test${Math.floor(Math.random() * 1000)}`;
const walletOrg1 = new FileSystemWallet('assets/walletOrg1');
const walletOrg2 = new FileSystemWallet('assets/walletOrg2');

beforeAll(async () => {
  try {
    await enrollOrg1Admin(walletOrg1);
    await enrollOrg2Admin(walletOrg2);
    await enrollOrg1CaAdmin(walletOrg1);
    await enrollOrg2CaAdmin(walletOrg2);
    await registerUser({
      enrollmentId: identityOrg1,
      enrollmentSecret: 'password',
      connectionProfile: 'connection/peer0org1.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet: walletOrg1,
      caAdmin: 'rca-org1-admin'
    });
    await registerUser({
      enrollmentId: identityOrg2,
      enrollmentSecret: 'password',
      connectionProfile: 'connection/peer0org2.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet: walletOrg2,
      caAdmin: 'rca-org2-admin'
    });
    contextOrg1 = await getNetwork({
      channelName: 'eventstore',
      enrollmentId: identityOrg1,
      connectionProfile: 'connection/peer0org1.yaml',
      wallet: walletOrg1,
      channelEventHub: 'peer0.org1.example.com'
    });
    contextOrg2 = await getNetwork({
      channelName: 'eventstore',
      enrollmentId: identityOrg2,
      connectionProfile: 'connection/peer0org2.yaml',
      wallet: walletOrg2,
      channelEventHub: 'peer0.org2.example.com'
    });
  } catch (error) {
    console.error(error);
    process.exit(-1);
  }
});

afterAll(async () => {
  await contextOrg1.gateway.disconnect();
  await contextOrg2.gateway.disconnect();
});

describe('Multiuser Tests', () => {
  it('should createCommit - identityA', async () => {
    // create at org1
    await submit(
      'createCommit',
      [
        entityName,
        identityOrg1,
        '0',
        JSON.stringify([{ type: 'Created', payload: { name: 'me' } }])
      ],
      { network: contextOrg1.network }
    )
      .then(result => values(result)[0])
      .then(commit => toCommit(JSON.stringify(commit)))
      .then(commit => (createdCommit_1 = commit));

    // query at org2
    await evaluate(
      'queryByEntityIdCommitId',
      [entityName, identityOrg1, createdCommit_1.commitId],
      { network: contextOrg2.network }
    )
      .then(result => values(result)[0])
      .then(commit => toCommit(JSON.stringify(commit)))
      .then(({ id, entityName }) => {
        expect(id).toBe(identityOrg1);
        expect(entityName).toBe(entityName);
      });
  });
});
