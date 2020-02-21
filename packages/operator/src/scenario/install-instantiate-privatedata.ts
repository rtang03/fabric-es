require('../env');
import execa from 'execa';
import Client, { ProposalErrorResponse, ProposalResponse } from 'fabric-client';
import { FileSystemWallet } from 'fabric-network';
import Listr from 'listr';
import UpdaterRenderer from 'listr-update-renderer';
import { createNetworkOperator } from '../createNetworkOperator';
import { DeploymentOption } from '../types';
import { getLogger, installChaincodeSubTask } from '../utils';

const bootstrap: (option?: DeploymentOption) => Promise<Listr> = async (
  option = { verbose: true, collapse: false }
) => {
  Client.setLogger(getLogger({ name: 'packages/operator' }));
  Client.setConfigSetting('initialize-with-discovery', true);
  const { verbose, collapse } = option;
  const walletOrg1 = new FileSystemWallet('./assets/walletOrg1');
  const walletOrg2 = new FileSystemWallet('./assets/walletOrg2');
  const fabricNetwork = process.env.FABRIC_NETWORK_PATH;
  const ordererTlsCaCert = process.env.ORDERER_TLSCA_CERT;
  const ordererName = process.env.ORDERER_NAME;
  const org1Operator = await createNetworkOperator({
    channelName: 'eventstore',
    ordererTlsCaCert,
    ordererName,
    context: {
      fabricNetwork,
      connectionProfile: './connection/network.yaml',
      wallet: walletOrg1
    }
  });

  const org2Operator = await createNetworkOperator({
    channelName: 'eventstore',
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
        title: 'Check installed chaincode',
        task: async (ctx, task) => {
          const { getInstalledCCVersion } = await org1Operator.getQueries({
            peerName: 'peer0.org1.example.com'
          });
          const ver = await getInstalledCCVersion('privatedata');
          if (ver) {
            task.title = `Check installed chaincode: "privatedata" already exist`;
            return Promise.reject();
          } else {
            task.title = `Check installed version: "privatedata" not exist`;
            return Promise.resolve();
          }
        }
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
              chaincodeId: 'privatedata',
              chaincodeVersion: '1.0',
              chaincodePath: '../chaincode',
              timeout: 60000,
              targets: ['peer0.org1.example.com', 'peer1.org1.example.com']
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
              chaincodeId: 'privatedata',
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
            chaincodeId: 'privatedata',
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
            },
            collectionsConfig: './collections.json'
          })
      },
      {
        title: 'Check installed chaincode',
        task: async (ctx, task) => {
          const { getInstalledCCVersion } = await org1Operator.getQueries({
            peerName: 'peer0.org1.example.com'
          });
          const ver = await getInstalledCCVersion('privatedata');
          task.title = `Check installed chaincode: ${ver}`;
          return Promise.resolve();
        }
      }
    ],
    // @ts-ignore
    { renderer: verbose ? 'verbose' : UpdaterRenderer, collapse }
  );
};

bootstrap().then(tasks =>
  tasks
    .run()
    .then(() => {
      console.log('💯  cc:"privatedata", channel:"eventstore" is installed');
    })
    .catch(error => {
      console.error(error);
      process.exit(-1);
    })
);
