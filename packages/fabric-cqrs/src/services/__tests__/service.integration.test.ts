import { ChannelEventHub } from 'fabric-client';
import { Gateway, Network } from 'fabric-network';
import { keys, pick, values } from 'lodash';
import { channelEventHub, evaluate, submit } from '..';
import { bootstrap } from '../../account/registerUser';
import '../../env';
import { toCommit } from '../../types/commit';

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
  const config = await bootstrap(identity);
  network = config.network;
  gateway = config.gateway;
  channelHub = config.channelHub;
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
      values(commits)
        .map(commit => toCommit(JSON.stringify(commit)))
        .forEach(commit =>
          expect(pick(commit, 'entityName')).toEqual({
            entityName: 'dev_entity'
          })
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
      .then(result => values(result)[0])
      .then(commit => toCommit(JSON.stringify(commit)))
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
      .then(result => values(result)[0])
      .then(commit => toCommit(JSON.stringify(commit)))
      .then(commit => expect(commit).toEqual(createdCommit_1)));

  it('should create #2', async () =>
    // cannot be version: '0' again, this is give error object, instead of Commit object
    submit(
      'createCommit',
      [
        entityName,
        identity,
        '1',
        JSON.stringify([{ type: 'User Created', payload: { name: 'you' } }])
      ],
      { network }
    )
      .then(result => values(result)[0])
      .then(commit => toCommit(JSON.stringify(commit)))
      .then(({ entityName }) => expect(entityName).toEqual('dev_test')));

  it('should queryByEntityName', async () =>
    evaluate('queryByEntityName', [entityName], {
      network
    }).then(commits =>
      values(commits)
        .map(commit => toCommit(JSON.stringify(commit)))
        .map(({ entityName }) => expect(entityName).toBe('dev_test'))
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

  it('should create #3 at version 0', async () =>
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

  it('should fail repeatedly reate #4 at version 0', async () =>
    submit(
      'createCommit',
      [
        entityName,
        identity,
        '0',
        JSON.stringify([{ type: 'User Created', payload: { name: 'you' } }])
      ],
      { network }
    ).then(result =>
      expect(result).toEqual({ status: 'ERROR', message: 'createCommit fails' })
    ));
});
