require('../env');
import { Wallets } from 'fabric-network';
import rimraf from 'rimraf';
import { createNetworkOperator } from '../createNetworkOperator';
import { enrollAdmin } from '../enrollAdmin';
import { NetworkOperator } from '../types';
import { isCommitRecord } from '../utils';

const mspId = process.env.MSPID;
const channelName = process.env.CHANNEL_NAME;
const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const connectionProfile = process.env.CONNECTION_PROFILE;
const fabricNetwork = process.env.NETWORK_ARTIFACTS;
const peerName = 'peer0-org1';
const blockNumber = 6;
const caName = 'rca-org1';
const enrollmentId = 'test0001';
const txSubmitter = process.env.ORG_ADMIN_ID;
const newId = `newId_${Math.floor(Math.random() * 10000)}`;
const sleep5 = new Promise((resolve) => setTimeout(() => resolve(true), 5000));

let operator: NetworkOperator;

beforeAll(async () => {
  rimraf.sync(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`);
  rimraf.sync(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`);
  const wallet = await Wallets.newFileSystemWallet(process.env.WALLET);

  await enrollAdmin({
    caName,
    connectionProfile,
    enrollmentID: process.env.ORG_ADMIN_ID,
    enrollmentSecret: process.env.ORG_ADMIN_SECRET,
    mspId,
    wallet,
  }).catch(async (e) => {
    console.error(e);
    await sleep5;
    process.exit(1);
  });

  await enrollAdmin({
    caName,
    connectionProfile,
    enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
    enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
    mspId,
    wallet,
  }).catch(async (e) => {
    console.error(e);
    await sleep5;
    process.exit(1);
  });

  operator = await createNetworkOperator({
    caAdmin,
    caAdminPW,
    caName,
    channelName,
    connectionProfile,
    mspId: process.env.MSPID,
    wallet,
  });
});

describe('Network operator - registerAndEnroll', () => {
  it('should registerAndEnroll', async () =>
    operator
      .registerAndEnroll({
        enrollmentId: newId,
        enrollmentSecret: 'password',
      })
      .then(({ disconnect, registerAndEnroll }) =>
        registerAndEnroll().then(({ status, info }) => {
          disconnect();
          expect(status).toEqual('SUCCESS');
          expect(info.startsWith('Successfully register & enroll')).toBeTruthy();
        })
      ));
});

describe('Network operator - submitOrEvaluateTx', () => {
  it('should submit transaction', async () =>
    operator
      .submitOrEvaluateTx({
        fcn: 'eventstore:createCommit',
        args: [
          'dev_test',
          `dev_test_${Math.floor(Math.random() * 10000)}`,
          '0',
          JSON.stringify([{ type: 'Created', payload: { name: 'me' } }]),
        ],
        identity: txSubmitter,
        asLocalhost: true,
        chaincodeId: 'eventstore',
      })
      .then(({ disconnect, submit }) =>
        submit().then((result) => {
          disconnect();
          expect(isCommitRecord(result)).toBeTruthy();
        })
      ));

  it('should evaluate transaction', async () =>
    operator
      .submitOrEvaluateTx({
        asLocalhost: true,
        fcn: 'eventstore:queryByEntityName',
        args: ['dev_test'],
        chaincodeId: 'eventstore',
        identity: txSubmitter,
      })
      .then(({ disconnect, evaluate }) =>
        evaluate().then((result) => {
          disconnect();
          expect(isCommitRecord(result)).toBeTruthy();
        })
      ));
});

describe('Network operator - getQueries', () => {
  it('should query - getMspid', async () =>
    operator.getQueries().then(({ getMspid }) => expect(getMspid()).toEqual(mspId)));

  // TODO: CAN REMOVE
  // it('should query - getChannels', async () =>
  //   operator
  //     .getQueries()
  //     .then(({ getChannels }) => getChannels(peerName))
  //     .then((result) => expect(result).toEqual({ channels: [{ channel_id: channelName }] })));
  // it('should query - getChainInfo', async () =>
  //   operator
  //     .getQueries()
  //     .then(async ({ getChainInfo }) => getChainInfo(peerName))
  //     .then((chainInfo) => {
  //       expect(typeof chainInfo.height).toEqual('object');
  //       expect(typeof chainInfo.currentBlockHash).toEqual('object');
  //     }));
  //
  // it('should query - ChannelPeers', async () =>
  //   operator
  //     .getQueries()
  //     .then(({ getBlockByNumber }) => getBlockByNumber(blockNumber))
  //     .then((block) => expect(block.header.number).toEqual(blockNumber.toString())));
});

describe('Network operator - identityService', () => {
  it('should getAll', async () =>
    operator
      .identityService()
      .then(({ getAll }) => getAll())
      .then(({ result, success }) => {
        expect(result.caname).toEqual(caName);
        expect(success).toBeTruthy();
      }));

  it('should delete - cleanup', async () =>
    operator
      .identityService()
      .then(({ deleteOne }) => deleteOne(enrollmentId))
      .then(() => console.info('record deleted'))
      .catch(() => console.info('record not exist')));

  it('should create', async () =>
    operator.identityService().then(({ create }) =>
      create({
        affiliation: 'org1', // default affiliation
        enrollmentID: enrollmentId,
      }).then((secret) => expect(typeof secret).toEqual('string'))
    ));

  // should getOne will return
  // {
  //   id: 'test0001',
  //   caname: 'rca-org1',
  //   success: true,
  //   attrs: [
  //     { name: 'hf.EnrollmentID', value: 'test0001', ecert: true },
  //     { name: 'hf.Type', value: 'client', ecert: true },
  //     { name: 'hf.Affiliation', value: 'org1', ecert: true }
  //   ]
  // }
  it('should getOne', async () =>
    operator
      .identityService()
      .then(({ getByEnrollmentId }) => getByEnrollmentId(enrollmentId))
      .then(({ result, success }) => {
        expect(result.id).toEqual(enrollmentId);
        expect(result.caname).toEqual(caName);
        expect(success).toBeTruthy();
      }));

  it('should delete', async () =>
    operator
      .identityService()
      .then(({ deleteOne }) => deleteOne(enrollmentId))
      .then(({ result, success }) => {
        expect(result.id).toEqual(enrollmentId);
        expect(result.caname).toEqual(caName);
        expect(success).toBeTruthy();
      }));
});
