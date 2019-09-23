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
  console.log('Start');
  await registerUser({
    enrollmentID: identity,
    enrollmentSecret: 'password'
  }).catch();
  console.log('Register User');
  const config = await getNetwork({ identity });
  console.log('Get Network');
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
      console.log(commit.id)
    );
    registerId = await channelEventHub(channelHub).registerCCEvent(event);
  });

  // it('should query all commits', async () =>
  //   await evaluate('queryByEntityName', ['dev_entity'], {
  //     network
  //   }).then(commits =>
  //     values<Commit>(commits).forEach(commit =>
  //       expect(pick(commit, 'entityName')).toEqual({ entityName: 'dev_entity' })
  //     )
  //   ));

  // it('should delete all dev_test entity', async () =>
  //   await submit('deleteByEntityId', [entityName, identity], {
  //     network
  //   }));
  //
  it('should create #1', async () =>
    await submit(
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
  //
  // it('should queryByEntityIdCommitId', async () =>
  //   await evaluate(
  //     'queryByEntityIdCommitId',
  //     [entityName, identity, createdCommit_1.commitId],
  //     { network }
  //   )
  //     .then<Commit>(result => values(result)[0])
  //     .then(commit => expect(commit).toEqual(createdCommit_1)));
  //
  // it('should create #2', async () =>
  //   await submit(
  //     'createCommit',
  //     [
  //       entityName,
  //       identity,
  //       '0',
  //       JSON.stringify([{ type: 'User Created', payload: { name: 'you' } }])
  //     ],
  //     { network }
  //   ));
  //
  // it('should queryByEntityName', async () =>
  //   await evaluate('queryByEntityName', [entityName], {
  //     network
  //   }).then(result => expect(keys(result).length).toEqual(2)));
  //
  // it('should queryByEntityId #1', async () =>
  //   await evaluate('queryByEntityId', [entityName, identity], {
  //     network
  //   }).then(result => expect(keys(result).length).toEqual(2)));
  //
  // it('should deleteByEntityIdCommitId', async () =>
  //   await submit(
  //     'deleteByEntityIdCommitId',
  //     [entityName, identity, createdCommit_1.commitId],
  //     { network }
  //   ).then(result => expect(result[createdCommit_1.commitId]).toEqual({})));
  //
  // it('should fail to delete non-exist entity by EntityId/CommitId', async () =>
  //   await submit(
  //     'deleteByEntityIdCommitId',
  //     [entityName, identity, createdCommit_1.commitId],
  //     { network }
  //   ).then(({ error }) =>
  //     expect(error.message).toEqual('Endorsement has failed')
  //   ));
  //
  // it('should queryByEntityId #2', async () =>
  //   await evaluate('queryByEntityId', [entityName, identity], {
  //     network
  //   }).then(result => expect(keys(result).length).toEqual(1)));
  //
  // it('should deleteByEntityId', async () =>
  //   await submit('deleteByEntityId', [entityName, identity], {
  //     network
  //   }).then(result => expect(values(result)[0]).toEqual({})));
  //
  // it('should queryByEntityId #3', async () =>
  //   await evaluate('queryByEntityId', [entityName, identity], {
  //     network
  //   }).then(result => expect(result).toEqual({})));
});
