require('../../env');
import { FileSystemWallet, Gateway, Network } from 'fabric-network';
import { values } from 'lodash';
import { bootstrapNetwork } from '../../account';
import { Commit } from '../../types';
import { evaluate, submitPrivateData } from '..';

let network: Network;
let gateway: Gateway;
let createdCommit_1: Commit;
let createdCommit_2: Commit;

const org1 = 'etcPrivateDetails';
const entityName = 'dev_test_privatedata';
const transient = {
  eventstr: Buffer.from(JSON.stringify([{ type: 'Created', payload: { name: 'me' } }]))
};
const enrollmentId = `service_privatedata${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  try {
    await bootstrapNetwork({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      channelEventHub: process.env.CHANNEL_HUB,
      channelName: process.env.CHANNEL_NAME,
      connectionProfile: process.env.CONNECTION_PROFILE,
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet: new FileSystemWallet(process.env.WALLET),
      enrollmentId,
      enrollmentSecret: 'password'
    }).then(config => {
      network = config.network;
      gateway = config.gateway;
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => gateway.disconnect());

describe('Event store Tests: Privatedata', () => {
  it('should createCommit #1', async () =>
    submitPrivateData('privatedata:createCommit', [org1, entityName, enrollmentId, '0'], transient, { network })
      .then<Commit>(result => values(result)[0])
      .then(commit => {
        createdCommit_1 = commit;
        return expect(commit.entityId).toEqual(enrollmentId);
      }));

  it('should createCommit #2', async () =>
    submitPrivateData('privatedata:createCommit', [org1, entityName, enrollmentId, '0'], transient, { network })
      .then<Commit>(result => values(result)[0])
      .then(commit => (createdCommit_2 = commit)));

  it('should queryByEntityId #1', async () =>
    evaluate('privatedata:queryByEntityId', [org1, entityName, enrollmentId], { network }, true).then(result =>
      values(result).map(commit => expect(commit.id).toEqual(enrollmentId))
    ));

  it('should queryByEntityName', async () =>
    evaluate('privatedata:queryByEntityName', [org1, entityName], { network }, true).then(result =>
      values(result).map(commit => expect(commit.entityName).toEqual(entityName))
    ));

  it('should deleteByEntityIdCommitId #1', async () =>
    submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, enrollmentId, createdCommit_1.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should fail to deleteByEntityIdCommitId', async () =>
    submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, enrollmentId, createdCommit_1.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should deleteByEntityIdCommitId #2', async () =>
    submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, enrollmentId, createdCommit_2.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));
});
