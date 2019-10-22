import { Gateway, Network } from 'fabric-network';
import { values } from 'lodash';
import { evaluate, submitPrivateData } from '..';
import { bootstrap } from '../../account/registerUser';
import { Commit } from '../../types';

let network: Network;
let gateway: Gateway;
let createdCommit_1: Commit;
let createdCommit_2: Commit;
const org1 = 'Org1PrivateDetails';
const entityName = 'dev_test_privatedata';
const transient = {
  eventstr: Buffer.from(
    JSON.stringify([{ type: 'Created', payload: { name: 'me' } }])
  )
};
const identity = `service_privatedata${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  const config = await bootstrap(identity);
  network = config.network;
  gateway = config.gateway;
});

afterAll(async () => await gateway.disconnect());

describe('Event store Tests: Privatedata', () => {
  it('should createCommit #1', async () =>
    submitPrivateData(
      'privatedata:createCommit',
      [org1, entityName, identity, '0'],
      transient,
      { network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => {
        createdCommit_1 = commit;
        return expect(commit.entityId).toEqual(identity);
      }));

  it('should createCommit #2', async () =>
    submitPrivateData(
      'privatedata:createCommit',
      [org1, entityName, identity, '0'],
      transient,
      { network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => (createdCommit_2 = commit)));

  it('should queryByEntityId #1', async () =>
    evaluate(
      'privatedata:queryByEntityId',
      [org1, entityName, identity],
      { network },
      true
    ).then(result =>
      values(result).map(commit => expect(commit.id).toEqual(identity))
    ));

  it('should queryByEntityName', async () =>
    evaluate(
      'privatedata:queryByEntityName',
      [org1, entityName],
      { network },
      true
    ).then(result =>
      values(result).map(commit =>
        expect(commit.entityName).toEqual(entityName)
      )
    ));

  it('should deleteByEntityIdCommitId #1', async () =>
    submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, identity, createdCommit_1.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should fail to deleteByEntityIdCommitId', async () =>
    submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, identity, createdCommit_1.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should deleteByEntityIdCommitId #2', async () =>
    submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, identity, createdCommit_2.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));
});
