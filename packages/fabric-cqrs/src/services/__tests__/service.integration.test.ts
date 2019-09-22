import { ChannelEventHub } from 'fabric-client';
import { Gateway, Network } from 'fabric-network';
import { keys, pick, values } from 'lodash';
import { channelEventHub, evaluate, getNetwork, submit } from '..';
import { Commit } from '../../types';

let config: {
  network: Network;
  gateway: Gateway;
  channelHub: ChannelEventHub;
};
let registerId;
let createdCommit_1: any;

// onChannelEventArrived is an injected implementation. In this test, it sends to console.log
// In real implementation, it is replaced by queryAction.merge action.
const context = { onChannelEventArrived: jest.fn() };
const entityName = 'dev_test';
const id = 'unit_test_01';

beforeAll(async () => {
  config = await getNetwork();
});

afterAll(async () => {
  await config.channelHub.unregisterChaincodeEvent(registerId, true);
  await config.gateway.disconnect();
});

describe('Event store Tests', () => {
  it('should return channel event hub', async () => {
    context.onChannelEventArrived.mockImplementation(
      ({ commit }) => null
      // console.log(commit.id)
    );
    registerId = await channelEventHub(
      config.channelHub
    ).registerChaincodeEvent(context);
  });

  it('should query all commits', async () =>
    await evaluate('queryByEntityName', ['dev_entity'], {
      network: config.network
    }).then(commits =>
      values<Commit>(commits).forEach(commit =>
        expect(pick(commit, 'entityName')).toEqual({ entityName: 'dev_entity' })
      )
    ));

  it('should delete all dev_test entity', async () =>
    await submit('deleteByEntityId', [entityName, id], {
      network: config.network
    }));

  it('should create #1', async () =>
    await submit(
      'createCommit',
      [
        entityName,
        id,
        '0',
        JSON.stringify([{ type: 'User Created', payload: { name: 'me' } }])
      ],
      { network: config.network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => {
        createdCommit_1 = commit;
        return expect(commit.entityId).toEqual(id);
      }));

  it('should queryByEntityIdCommitId', async () =>
    await evaluate(
      'queryByEntityIdCommitId',
      [entityName, id, createdCommit_1.commitId],
      { network: config.network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => expect(commit).toEqual(createdCommit_1)));

  it('should create #2', async () =>
    await submit(
      'createCommit',
      [
        entityName,
        id,
        '0',
        JSON.stringify([{ type: 'User Created', payload: { name: 'you' } }])
      ],
      { network: config.network }
    ));

  it('should queryByEntityName', async () =>
    await evaluate('queryByEntityName', [entityName], {
      network: config.network
    }).then(result => expect(keys(result).length).toEqual(2)));

  it('should queryByEntityId #1', async () =>
    await evaluate('queryByEntityId', [entityName, id], {
      network: config.network
    }).then(result => expect(keys(result).length).toEqual(2)));

  it('should deleteByEntityIdCommitId', async () =>
    await submit(
      'deleteByEntityIdCommitId',
      [entityName, id, createdCommit_1.commitId],
      { network: config.network }
    ).then(result => expect(result[createdCommit_1.commitId]).toEqual({})));

  it('should fail to delete non-exist entity by EntityId/CommitId', async () =>
    await submit(
      'deleteByEntityIdCommitId',
      [entityName, id, createdCommit_1.commitId],
      { network: config.network }
    ).then(({ error }) =>
      expect(error.message).toEqual('Endorsement has failed')
    ));

  it('should queryByEntityId #2', async () =>
    await evaluate('queryByEntityId', [entityName, id], {
      network: config.network
    }).then(result => expect(keys(result).length).toEqual(1)));

  it('should deleteByEntityId', async () =>
    await submit('deleteByEntityId', [entityName, id], {
      network: config.network
    }).then(result => expect(values(result)[0]).toEqual({})));

  it('should queryByEntityId #3', async () =>
    await evaluate('queryByEntityId', [entityName, id], {
      network: config.network
    }).then(result => expect(result).toEqual({})));
});
