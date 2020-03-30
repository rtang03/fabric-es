require('../env');
import execa from 'execa';
import Client, { ProposalErrorResponse, ProposalResponse } from 'fabric-client';
import { Wallets } from 'fabric-network';
import Listr from 'listr';
import UpdaterRenderer from 'listr-update-renderer';
import { createNetworkOperator } from '../createNetworkOperator';
import { DeploymentOption } from '../types';
import { getLogger, installChaincodeSubTask } from '../utils';

let current_version: string;
let upgrade_version: string;

const bootstrap: (option?: DeploymentOption) => Promise<Listr> = async (
  option = { verbose: true, collapse: false }
) => {
  Client.setLogger(getLogger({ name: 'packages/operator' }));
  Client.setConfigSetting('initialize-with-discovery', true);
  const { verbose, collapse } = option;
  const walletOrg1 = await Wallets.newFileSystemWallet('./assets/walletOrg1');
  const walletOrg2 = await Wallets.newFileSystemWallet('./assets/walletOrg2');
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
        title: 'Check current version',
        task: async (ctx, task) => {
          const { getInstalledCCVersion } = await org1Operator.getQueries({
            peerName: 'peer0.org1.example.com'
          });
          current_version = await getInstalledCCVersion('privatedata');
          task.title = `Check current version: ${current_version}`;
          let ver = parseInt(current_version, 10);
          upgrade_version = `${++ver}.0`;
          return current_version;
        }
      },
      {
        title: 'Build chaincode',
        task: () => execa('yarn', ['run', 'build-chaincode'])
      },
      {
        title: `[Org1MSP] Install chaincode`,
        task: (ctx, task) =>
          org1Operator
            .install({
              chaincodeId: 'privatedata',
              chaincodeVersion: upgrade_version,
              chaincodePath: '../chaincode',
              timeout: 60000,
              targets: ['peer0.org1.example.com', 'peer1.org1.example.com']
            })
            .then<(ProposalResponse | ProposalErrorResponse)[]>(result => result[0])
            .then(responses => installChaincodeSubTask(responses, task))
      },
      {
        title: `[Org2MSP] Install chaincode`,
        task: (ctx, task) =>
          org2Operator
            .install({
              chaincodeId: 'privatedata',
              chaincodeVersion: upgrade_version,
              chaincodePath: '../chaincode',
              timeout: 60000,
              targets: ['peer0.org2.example.com', 'peer1.org2.example.com']
            })
            .then<(ProposalResponse | ProposalErrorResponse)[]>(result => result[0])
            .then(responses => installChaincodeSubTask(responses, task))
      },
      {
        title: 'Instantiate chaincode',
        task: () =>
          org1Operator.instantiate({
            chaincodeId: 'privatedata',
            chaincodeVersion: upgrade_version,
            fcn: 'instantiate',
            args: [],
            upgrade: true,
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
        title: 'Check current version',
        task: async (ctx, task) => {
          const { getInstalledCCVersion } = await org1Operator.getQueries({
            peerName: 'peer0.org1.example.com'
          });
          const ver = await getInstalledCCVersion('privatedata');
          task.title = `Check current version: ${ver}`;
          return ver;
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
      console.log(`💯  "privatedata" is upgraded ${current_version} -> ${upgrade_version}`);
    })
    .catch(error => {
      console.error(error);
      process.exit(-1);
    })
);
