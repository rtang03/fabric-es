import { Gateway, Network } from 'fabric-network';
import { values } from 'lodash';
import { evaluate, getNetwork, submitPrivateData } from '..';
import { registerUser } from '../../account/registerUser';
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
  try {
    await registerUser({
      enrollmentID: identity,
      enrollmentSecret: 'password'
    });
    const config = await getNetwork({ identity });
    network = config.network;
    gateway = config.gateway;
  } catch (error) {
    console.error(error);
    process.exit(-1);
  }
});

afterAll(async () => await gateway.disconnect());

describe('Event store Tests: Privatedata', () => {
  it('should createCommit #1', async () => {
    await submitPrivateData(
      'privatedata:createCommit',
      [org1, entityName, identity, '0'],
      transient,
      { network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => {
        createdCommit_1 = commit;
        return expect(commit.entityId).toEqual(identity);
      });
  });

  it('should createCommit #2', async () => {
    await submitPrivateData(
      'privatedata:createCommit',
      [org1, entityName, identity, '0'],
      transient,
      { network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => (createdCommit_2 = commit));
  });

  it('should queryByEntityId #1', async () =>
    await evaluate(
      'privatedata:queryByEntityId',
      [org1, entityName, identity],
      { network },
      true
    ).then(result =>
      values(result).map(commit => expect(commit.id).toEqual(identity))
    ));

  it('should queryByEntityName', async () =>
    await evaluate(
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
    await submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, identity, createdCommit_1.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should fail to deleteByEntityIdCommitId', async () =>
    await submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, identity, createdCommit_1.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should deleteByEntityIdCommitId #2', async () =>
    await submitPrivateData(
      'privatedata:deleteByEntityIdCommitId',
      [org1, entityName, identity, createdCommit_2.commitId],
      null,
      { network }
    ).then(({ status }) => expect(status).toBe('SUCCESS')));
});