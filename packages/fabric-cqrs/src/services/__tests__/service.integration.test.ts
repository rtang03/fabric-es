import { ChannelEventHub } from 'fabric-client';
import { Gateway, Network } from 'fabric-network';
import { keys, pick, values } from 'lodash';
import { channelEventHub, evaluate, getNetwork, submit } from '..';
import { registerUser } from '../../account/registerUser';
import '../../env';
import { Commit } from '../../types';

let network: Network;
let gateway: Gateway;
let channelHub: ChannelEventHub;
let registerId;
let createdCommit_1: any;

// onChannelEventArrived is an injected implementation. In this test, it sends to console.log
// In real implementation, it is replaced by queryAction.merge action.
const event = { onChannelEventArrived: jest.fn() };
const entityName = 'dev_test';
const identity = `service_test${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  try {
    await registerUser({
      enrollmentID: identity,
      enrollmentSecret: 'password'
    });
    const config = await getNetwork({ identity });
    network = config.network;
    gateway = config.gateway;
    channelHub = config.channelHub;
  } catch (error) {
    console.error(error);
    process.exit(-1);
  }
});

afterAll(async () => {
  await channelHub.unregisterChaincodeEvent(registerId, true);
  await gateway.disconnect();
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
      values<Commit>(commits).forEach(commit =>
        expect(pick(commit, 'entityName')).toEqual({ entityName: 'dev_entity' })
      )
    ));

  it('should create #1', async () =>
    submit(
      'createCommit',
      [
        entityName,
        identity,
        '0',
        JSON.stringify([{ type: 'User Created', payload: { name: 'me' } }])
      ],
      { network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => {
        createdCommit_1 = commit;
        return expect(commit.entityId).toEqual(identity);
      }));

  it('should queryByEntityIdCommitId', async () =>
    evaluate(
      'queryByEntityIdCommitId',
      [entityName, identity, createdCommit_1.commitId],
      { network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => expect(commit).toEqual(createdCommit_1)));

  it('should create #2', async () =>
    submit(
      'createCommit',
      [
        entityName,
        identity,
        '0',
        JSON.stringify([{ type: 'User Created', payload: { name: 'you' } }])
      ],
      { network }
    ));

  it('should queryByEntityName', async () =>
    evaluate('queryByEntityName', [entityName], {
      network
    }).then(commits =>
      values<Commit>(commits).map(({ entityName }) =>
        expect(entityName).toBe('dev_test')
      )
    ));

  it('should queryByEntityId #1', async () =>
    evaluate('queryByEntityId', [entityName, identity], {
      network
    }).then(result => expect(keys(result).length).toEqual(2)));

  it('should deleteByEntityIdCommitId', async () =>
    submit(
      'deleteByEntityIdCommitId',
      [entityName, identity, createdCommit_1.commitId],
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should fail to delete non-exist entity by EntityId/CommitId', async () =>
    submit(
      'deleteByEntityIdCommitId',
      [entityName, identity, createdCommit_1.commitId],
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should queryByEntityId #2', async () =>
    evaluate('queryByEntityId', [entityName, identity], {
      network
    }).then(result => expect(keys(result).length).toEqual(1)));

  it('should deleteByEntityId', async () =>
    submit('deleteByEntityId', [entityName, identity], {
      network
    }).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should queryByEntityId #3', async () =>
    evaluate('queryByEntityId', [entityName, identity], {
      network
    }).then(result => expect(result).toEqual({})));
});
