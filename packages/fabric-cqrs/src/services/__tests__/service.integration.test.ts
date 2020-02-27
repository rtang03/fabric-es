require('../../env');
import { ChannelEventHub } from 'fabric-client';
import { FileSystemWallet, Gateway, Network } from 'fabric-network';
import { keys, omit, pick, values } from 'lodash';
import { bootstrapNetwork } from '../../account';
import { Commit } from '../../types';
import { channelEventHub, evaluate, submit } from '..';

let network: Network;
let gateway: Gateway;
let channelHub: ChannelEventHub;
let registerId;
let createdCommit_1: any;

// onChannelEventArrived is an injected implementation. In this test, it sends to console.log
// In real implementation, it is replaced by queryAction.merge action.
const event = { onChannelEventArrived: jest.fn() };
const entityName = 'dev_test';
const enrollmentId = `service_test${Math.floor(Math.random() * 1000)}`;

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
      channelHub = config.channelHub;
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  channelHub.unregisterChaincodeEvent(registerId, true);
  gateway.disconnect();
});

describe('Eventstore Tests', () => {
  it('should return channel event hub', async () => {
    event.onChannelEventArrived.mockImplementation(({ commit }) =>
      console.log(`Receive channel event from Identity: ${commit.id}`)
    );
    registerId = await channelEventHub(channelHub).registerCCEvent(event);
  });

  it('should query all commits', async () =>
    evaluate('queryByEntityName', ['dev_entity'], {
      network
    }).then(commits =>
      values(commits).forEach((commit: Commit) =>
        expect(pick(commit, 'entityName')).toEqual({
          entityName: 'dev_entity'
        })
      )
    ));

  it('should create #1', async () =>
    submit(
      'createCommit',
      [entityName, enrollmentId, '0', JSON.stringify([{ type: 'User Created', payload: { name: 'me' } }])],
      { network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => {
        createdCommit_1 = commit;
        return expect(commit.entityId).toEqual(enrollmentId);
      }));

  it('should queryByEntityIdCommitId', async () =>
    evaluate('queryByEntityIdCommitId', [entityName, enrollmentId, createdCommit_1.commitId], { network })
      .then<Commit>(commits => values(commits)[0])
      .then(commit => expect(omit(commit, 'events')).toEqual(createdCommit_1)));

  it('should create #2', async () =>
    // cannot be version: '0' again, this is give error object, instead of Commit object
    submit(
      'createCommit',
      [entityName, enrollmentId, '1', JSON.stringify([{ type: 'User Created', payload: { name: 'you' } }])],
      { network }
    )
      .then<Commit>(commits => values(commits)[0])
      .then(({ entityName }) => expect(entityName).toEqual('dev_test')));

  it('should queryByEntityName', async () =>
    evaluate('queryByEntityName', [entityName], {
      network
    }).then(commits => values(commits).map(({ entityName }) => expect(entityName).toBe('dev_test'))));

  it('should queryByEntityId #1', async () =>
    evaluate('queryByEntityId', [entityName, enrollmentId], {
      network
    }).then(result => expect(keys(result).length).toEqual(2)));

  it('should deleteByEntityIdCommitId', async () =>
    submit('deleteByEntityIdCommitId', [entityName, enrollmentId, createdCommit_1.commitId], {
      network
    }).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should fail to delete non-exist entity by EntityId/CommitId', async () =>
    submit('deleteByEntityIdCommitId', [entityName, enrollmentId, createdCommit_1.commitId], {
      network
    }).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should queryByEntityId #2', async () =>
    evaluate('queryByEntityId', [entityName, enrollmentId], {
      network
    }).then(result => expect(keys(result).length).toEqual(1)));

  it('should deleteByEntityId', async () =>
    submit('deleteByEntityId', [entityName, enrollmentId], {
      network
    }).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should queryByEntityId #3', async () =>
    evaluate('queryByEntityId', [entityName, enrollmentId], {
      network
    }).then(result => expect(result).toEqual({})));

  it('should create #3 at version 0', async () =>
    submit(
      'createCommit',
      [entityName, enrollmentId, '0', JSON.stringify([{ type: 'User Created', payload: { name: 'you' } }])],
      { network }
    ));
});
