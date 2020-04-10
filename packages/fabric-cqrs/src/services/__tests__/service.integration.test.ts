require('../../env');
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets, Gateway, Network, Wallet, ContractListener } from 'fabric-network';
import { keys, omit, pick, values } from 'lodash';
import rimraf from 'rimraf';
import { registerUser } from '../../account';
import { Commit } from '../../types';
import { evaluate, getNetwork, submit } from '..';

let network: Network;
let gateway: Gateway;
let createdCommit_1: any;
let wallet: Wallet;
let listener: ContractListener;

const connectionProfile = process.env.CONNECTION_PROFILE;
const channelName = process.env.CHANNEL_NAME;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const entityName = 'dev_test';
const enrollmentId = `service_test${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  try {
    rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
    rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);

    wallet = await Wallets.newFileSystemWallet(process.env.WALLET);

    await enrollAdmin({
      caUrl: process.env.ORG_CA_URL,
      connectionProfile,
      enrollmentID: process.env.ORG_ADMIN_ID,
      enrollmentSecret: process.env.ORG_ADMIN_SECRET,
      fabricNetwork,
      mspId,
      wallet
    });

    await enrollAdmin({
      caUrl: process.env.ORG_CA_URL,
      connectionProfile,
      enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
      enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      fabricNetwork,
      mspId,
      wallet
    });

    await registerUser({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
      fabricNetwork,
      enrollmentId,
      enrollmentSecret: 'password',
      connectionProfile,
      wallet,
      mspId
    });

    const context = await getNetwork({
      channelName,
      connectionProfile,
      wallet,
      enrollmentId,
      discovery: true,
      asLocalhost: true
    });
    network = context.network;
    gateway = context.gateway;
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  listener = network.getContract('eventstore').addContractListener(
    ({ payload, eventName }) => {
      console.log(`contract event arrives => ${eventName}`, payload.toString('utf8'));
    },
    { type: 'full' }
  );
});

afterAll(async () => {
  rimraf.sync(`${process.env.WALLET}/${enrollmentId}.id`);
  network.getContract('eventstore').removeContractListener(listener);
  gateway.disconnect();
});

describe('Eventstore Tests', () => {
  it('should query all commits', async () =>
    evaluate('eventstore:queryByEntityName', ['dev_entity'], { network }, false).then(commits =>
      values(commits).forEach((commit: Commit) =>
        expect(pick(commit, 'entityName')).toEqual({
          entityName: 'dev_entity'
        })
      )
    ));

  it('should create #1', async () =>
    submit(
      'eventstore:createCommit',
      [entityName, enrollmentId, '0', JSON.stringify([{ type: 'User Created', payload: { name: 'me' } }])],
      { network }
    )
      .then<Commit>(result => values(result)[0])
      .then(commit => {
        createdCommit_1 = commit;
        return expect(commit.entityId).toEqual(enrollmentId);
      }));

  it('should queryByEntityIdCommitId', async () =>
    evaluate('eventstore:queryByEntityIdCommitId', [entityName, enrollmentId, createdCommit_1.commitId], { network }, false)
      .then<Commit>(commits => values(commits)[0])
      .then(commit => expect(omit(commit, 'events')).toEqual(createdCommit_1)));

  it('should create #2', async () =>
    // cannot be version: '0' again, this is give error object, instead of Commit object
    submit(
      'eventstore:createCommit',
      [entityName, enrollmentId, '1', JSON.stringify([{ type: 'User Created', payload: { name: 'you' } }])],
      { network }
    )
      .then<Commit>(commits => values(commits)[0])
      .then(({ entityName }) => expect(entityName).toEqual('dev_test')));

  it('should queryByEntityName', async () =>
    evaluate(
      'eventstore:queryByEntityName',
      [entityName],
      {
        network
      },
      false
    ).then(commits => values(commits).map(({ entityName }) => expect(entityName).toBe('dev_test'))));

  it('should queryByEntityId #1', async () =>
    evaluate(
      'eventstore:queryByEntityId',
      [entityName, enrollmentId],
      {
        network
      },
      false
    ).then(result => expect(keys(result).length).toEqual(2)));

  it('should deleteByEntityIdCommitId', async () =>
    submit('eventstore:deleteByEntityIdCommitId', [entityName, enrollmentId, createdCommit_1.commitId], {
      network
    }).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should fail to delete non-exist entity by EntityId/CommitId', async () =>
    submit('eventstore:deleteByEntityIdCommitId', [entityName, enrollmentId, createdCommit_1.commitId], {
      network
    }).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should queryByEntityId #2', async () =>
    evaluate(
      'eventstore:queryByEntityId',
      [entityName, enrollmentId],
      {
        network
      },
      false
    ).then(result => expect(keys(result).length).toEqual(1)));

  it('should deleteByEntityId', async () =>
    submit('eventstore:deleteByEntityId', [entityName, enrollmentId], {
      network
    }).then(({ status }) => expect(status).toBe('SUCCESS')));

  it('should queryByEntityId #3', async () =>
    evaluate(
      'eventstore:queryByEntityId',
      [entityName, enrollmentId],
      {
        network
      },
      false
    ).then(result => expect(result).toEqual({})));

  it('should create #3 at version 0', async () =>
    submit(
      'eventstore:createCommit',
      [entityName, enrollmentId, '0', JSON.stringify([{ type: 'User Created', payload: { name: 'you' } }])],
      { network }
    ));
});
