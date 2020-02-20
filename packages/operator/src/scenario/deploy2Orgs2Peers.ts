require('../env');
import execa from 'execa';
import Client, { ProposalErrorResponse, ProposalResponse } from 'fabric-client';
import { FileSystemWallet } from 'fabric-network';
import Listr from 'listr';
import UpdaterRenderer from 'listr-update-renderer';
import { createNetworkOperator } from '../createNetworkOperator';
import { enrollAdmin } from '../enrollAdmin';
import { CHANNEL_ALREADY_EXIST, DeploymentOption } from '../types';
import {
  getLogger,
  installChaincodeSubTask,
  isCommitRecord,
  joinChannelSubTask
} from '../utils';

const bootstrap: (option?: DeploymentOption) => Promise<Listr> = async (
  option = { verbose: true, collapse: false }
) => {
  Client.setLogger(getLogger({ name: 'packages/operator' }));
  Client.setConfigSetting('initialize-with-discovery', true);
  const { verbose, collapse } = option;
  // TODO: In v2, below API is deprecated
  const walletOrg1 = new FileSystemWallet('./assets/walletOrg1');
  const walletOrg2 = new FileSystemWallet('./assets/walletOrg2');
  const fabricNetwork = process.env.FABRIC_NETWORK_PATH;
  const ordererTlsCaCert = process.env.ORDERER_TLSCA_CERT;
  const ordererName = process.env.ORDERER_NAME;
  const org1Operator = await createNetworkOperator({
    channelName: process.env.CHANNEL_NAME,
    ordererTlsCaCert,
    ordererName,
    context: {
      fabricNetwork,
      connectionProfile: './connection/network.yaml',
      wallet: walletOrg1
    }
  });

  const org2Operator = await createNetworkOperator({
    channelName: process.env.CHANNEL_NAME,
    ordererTlsCaCert,
    ordererName,
    context: {
      fabricNetwork,
      connectionProfile: './connection/org2.yaml',
      wallet: walletOrg2
    }
  });

  return new Listr(
    [
      {
        title: '[Org1MSP] Enroll CA Admin',
        task: () =>
          enrollAdmin({
            label: 'rca-org1-admin',
            enrollmentID: 'rca-org1-admin',
            enrollmentSecret: 'rca-org1-adminPW',
            caUrl: 'https://0.0.0.0:5054',
            mspId: 'Org1MSP',
            context: {
              fabricNetwork,
              connectionProfile: './connection/org1.yaml',
              wallet: walletOrg1
            }
          })
      },
      {
        title: '[Org1MSP] Enroll Organization Admin',
        task: () =>
          enrollAdmin({
            label: 'admin-org1.example.com',
            enrollmentID: 'admin-org1.example.com',
            enrollmentSecret: 'Org1MSPAdminPW',
            caUrl: 'https://0.0.0.0:5054',
            mspId: 'Org1MSP',
            context: {
              fabricNetwork,
              connectionProfile: './connection/org1.yaml',
              wallet: walletOrg1
            }
          })
      },
      {
        title: '[Org2MSP] Enroll CA Admin',
        task: () =>
          enrollAdmin({
            label: 'rca-org2-admin',
            enrollmentID: 'rca-org2-admin',
            enrollmentSecret: 'rca-org2-adminPW',
            caUrl: 'https://0.0.0.0:5055',
            mspId: 'Org2MSP',
            context: {
              fabricNetwork,
              connectionProfile: './connection/org2.yaml',
              wallet: walletOrg2
            }
          })
      },
      {
        title: '[Org2MSP] Enroll Organization Admin',
        task: () =>
          enrollAdmin({
            label: 'admin-org2.example.com',
            enrollmentID: 'admin-org2.example.com',
            enrollmentSecret: 'Org2MSPAdminPW',
            caUrl: 'https://0.0.0.0:5055',
            mspId: 'Org2MSP',
            context: {
              fabricNetwork,
              connectionProfile: './connection/org2.yaml',
              wallet: walletOrg2
            }
          })
      },
      {
        title: `mkdir ${process.env.CHANNEL_CONFIG_PATH}`,
        task: () =>
          execa('mkdir', ['-p', process.env.CHANNEL_CONFIG_PATH]).then(
            ({ stdout }) => {
              if (stdout !== '') throw new Error('Fail to make directory');
            }
          )
      },
      {
        title: 'configtxgen channel.tx',
        task: () =>
          execa(`${fabricNetwork}/../bin/configtxgen`, [
            '-configPath',
            `${process.env.FABRIC_NETWORK_PATH}/../config`,
            '-profile',
            'OrgsChannel',
            '-channelID',
            process.env.CHANNEL_NAME,
            '-outputCreateChannelTx',
            `${process.env.CHANNEL_CONFIG_PATH}/${process.env.CHANNEL_NAME}.tx`
          ]).then(({ stdout }) => {
            if (stdout !== '')
              throw new Error('Fail to configtxgen channel.tx');
          })
      },
      {
        title: 'Create "eventstore" channel',
        skip: () =>
          org1Operator
            .createChannel({
              channelTxPath: process.env.CHANNEL_CONFIG_PATH
            })
            .then((result: any) => result?.message === CHANNEL_ALREADY_EXIST),
        task: () => Promise.resolve('done')
      },
      {
        title: '[peer0.org1, peer1.org1] Join channel',
        task: (ctx, task) =>
          org1Operator
            .joinChannel({
              targets: ['peer0.org1.example.com', 'peer1.org1.example.com']
            })
            .then((responses: any[]) => joinChannelSubTask(responses, task))
      },
      {
        title: '[Org1MSP] Update anchor peers',
        task: (ctx, task) =>
          new Listr([
            {
              title: 'configtxgen Org1MSPanchors.tx',
              task: () =>
                execa(`${fabricNetwork}/../bin/configtxgen`, [
                  '-configPath',
                  `${process.env.FABRIC_NETWORK_PATH}/../config`,
                  '-profile',
                  'OrgsChannel',
                  '-channelID',
                  process.env.CHANNEL_NAME,
                  '-outputAnchorPeersUpdate',
                  `${process.env.CHANNEL_CONFIG_PATH}/Org1MSPanchors.tx`,
                  '-asOrg',
                  'Org1MSP'
                ]).then(({ stdout }) => {
                  if (stdout !== '')
                    throw new Error('Fail to configtxgen Org1MSPanchors.tx');
                })
            },
            {
              title: 'update anchor peer',
              task: () =>
                org1Operator
                  .updateAnchorPeers({
                    configUpdatePath: `${process.env.CHANNEL_CONFIG_PATH}/Org1MSPanchors.tx`
                  })
                  .then(result => {
                    if (result?.info !== '' && result?.status === 'BAD_REQUEST')
                      task.skip(result.info);
                    return result.status;
                  })
            }
          ])
      },
      {
        title: '[peer0.org2, peer1.org2] Join channel',
        task: (ctx, task) =>
          org2Operator
            .joinChannel({
              targets: ['peer0.org2.example.com', 'peer1.org2.example.com']
            })
            .then((responses: any[]) => joinChannelSubTask(responses, task))
      },
      {
        title: '[Org2MSP] Update anchor peers',
        task: (ctx, task) =>
          new Listr([
            {
              title: 'configtxgen Org2MSPanchors.tx',
              task: () =>
                execa(`${fabricNetwork}/../bin/configtxgen`, [
                  '-configPath',
                  `${process.env.FABRIC_NETWORK_PATH}/../config`,
                  '-profile',
                  'OrgsChannel',
                  '-channelID',
                  process.env.CHANNEL_NAME,
                  '-outputAnchorPeersUpdate',
                  `${process.env.CHANNEL_CONFIG_PATH}/Org2MSPanchors.tx`,
                  '-asOrg',
                  'Org2MSP'
                ]).then(({ stdout }) => {
                  if (stdout !== '')
                    throw new Error('Fail to configtxgen Org2MSPanchors.tx');
                })
            },
            {
              title: 'update anchor peer',
              task: () =>
                org2Operator
                  .updateAnchorPeers({
                    configUpdatePath: `${process.env.CHANNEL_CONFIG_PATH}/Org2MSPanchors.tx`
                  })
                  .then(result => {
                    if (result?.info !== '' && result?.status === 'BAD_REQUEST')
                      task.skip(result.info);
                    return result.status;
                  })
            }
          ])
      },
      {
        title: 'Build chaincode',
        task: () => execa('yarn', ['run', 'build-chaincode'])
      },
      {
        title: '[Org1MSP] Install chaincode',
        task: (ctx, task) =>
          org1Operator
            .install({
              chaincodeId: 'eventstore',
              chaincodeVersion: '1.0',
              chaincodePath: '../chaincode',
              targets: ['peer0.org1.example.com', 'peer1.org1.example.com'],
              timeout: 60000
            })
            .then<Array<ProposalResponse | ProposalErrorResponse>>(
              result => result[0]
            )
            .then(responses => installChaincodeSubTask(responses, task))
      },
      {
        title: '[Org2MSP] Install chaincode',
        task: (ctx, task) =>
          org2Operator
            .install({
              chaincodeId: 'eventstore',
              chaincodeVersion: '1.0',
              chaincodePath: '../chaincode',
              timeout: 60000,
              targets: ['peer0.org2.example.com', 'peer1.org2.example.com']
            })
            .then<Array<ProposalResponse | ProposalErrorResponse>>(
              result => result[0]
            )
            .then(responses => installChaincodeSubTask(responses, task))
      },
      {
        title: 'Instantiate chaincode',
        task: () =>
          org1Operator.instantiate({
            chaincodeId: 'eventstore',
            chaincodeVersion: '1.0',
            fcn: 'instantiate',
            args: [],
            upgrade: false,
            timeout: 600000,
            endorsementPolicy: {
              identities: [
                { role: { name: 'member', mspId: 'Org1MSP' } },
                { role: { name: 'member', mspId: 'Org2MSP' } }
              ],
              policy: {
                '1-of': [{ 'signed-by': 0 }, { 'signed-by': 1 }]
              }
            }
          })
      },
      {
        title: '[Org1MSP] Query result',
        task: (ctx, task) =>
          org1Operator
            .submitOrEvaluateTx({
              asLocalhost: true,
              chaincodeId: 'eventstore',
              fcn: 'queryByEntityName',
              args: ['dev_entity'],
              identity: 'admin-org1.example.com'
            })
            .then(async ({ disconnect, evaluate }) => {
              const result = await evaluate();
              if (isCommitRecord(result))
                task.title = '[Org1MSP] Query result is validated';
              else task.title = '[Org1MSP] Query result validation fails';
              disconnect();
            })
      },
      {
        title: '[Org2MSP] Query result',
        task: (ctx, task) =>
          org2Operator
            .submitOrEvaluateTx({
              asLocalhost: true,
              chaincodeId: 'eventstore',
              fcn: 'queryByEntityName',
              args: ['dev_entity'],
              identity: 'admin-org2.example.com'
            })
            .then(async ({ disconnect, evaluate }) => {
              const result = await evaluate();
              if (isCommitRecord(result))
                task.title = '[Org2MSP] Query result is validated';
              else task.title = '[Org2MSP] Query result validation fails';
              disconnect();
            })
      }
    ],
    // @ts-ignore
    { renderer: verbose ? 'verbose' : UpdaterRenderer, collapse }
  );
};

bootstrap({ verbose: true, collapse: false }).then(tasks =>
  tasks
    .run()
    .then(() => {
      console.log('💯  cc:"eventstore", channel:"eventstore" is ready to use.');
    })
    .catch(error => {
      console.error(error);
      process.exit(-1);
    })
);
