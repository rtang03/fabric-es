import { Gateway, Network } from 'fabric-network';
import { keys, values } from 'lodash';
import { evaluate, getNetwork, submitPrivateData } from '..';
import { Commit } from '../../types';
import set = Reflect.set;

let config: {
  network: Network;
  gateway: Gateway;
};
let createdCommit_1: Commit;
let createdCommit_2: Commit;
const org1 = 'Org1PrivateDetails';
const entityName = 'dev_test_privatedata';
const id = 'privatedata_test_01';
const transient = {
  eventstr: Buffer.from(
    JSON.stringify([{ type: 'Created', payload: { name: 'me' } }])
  )
};

beforeAll(async () => {
  config = await getNetwork();
});

afterAll(async () => await config.gateway.disconnect());

describe('Event store Tests: Privatedata', () => {
  it('should createCommit #1', async () => {
    await submitPrivateData(
      'privatedata:createCommit',
      [org1, entityName, id, '0'],
      transient,
      { network: config.network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => {
        createdCommit_1 = commit;
        return expect(commit.entityId).toEqual(id);
      });
  });

  it('should createCommit #2', async () => {
    await submitPrivateData(
      'privatedata:createCommit',
      [org1, entityName, id, '0'],
      transient,
      { network: config.network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => (createdCommit_2 = commit));
  });

  it('should queryByEntityId #1', async () =>
    await evaluate(
      'privatedata:queryByEntityId',
      [org1, entityName, id],
      { network: config.network },
      true
    ).then(result =>
      values(result).map(commit => expect(commit.id).toEqual(id))
    ));

  it('should queryByEntityName', async () =>
    await evaluate(
      'privatedata:queryByEntityName',
      [org1, entityName],
      { network: config.network },
      true
    ).then(result =>
      values(result).map(commit =>
        expect(commit.entityName).toEqual(entityName)
      )
    ));

  it('should deleteByEntityIdCommitId #1', async () =>
    await submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, id, createdCommit_1.commitId],
      null,
      { network: config.network }
    ).then(result => expect(values(result)[0]).toEqual({})));

  it('should fail to deleteByEntityIdCommitId', async () =>
    await submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, id, createdCommit_1.commitId],
      null,
      { network: config.network }
    ).then(({ error }) =>
      expect(error.message).toEqual('Endorsement has failed')
    ));

  it('should deleteByEntityIdCommitId #2', async () =>
    await submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, id, createdCommit_2.commitId],
      null,
      { network: config.network }
    ).then(result => expect(values(result)[0]).toEqual({})));
});
