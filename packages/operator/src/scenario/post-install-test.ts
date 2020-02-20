require('../env');
import execa from 'execa';
import Client, { ProposalErrorResponse, ProposalResponse } from 'fabric-client';
import { FileSystemWallet } from 'fabric-network';
import Listr from 'listr';
import UpdaterRenderer from 'listr-update-renderer';
import { createNetworkOperator } from '../createNetworkOperator';
import { DeploymentOption } from '../types';
import { getLogger } from '../utils';

(async ({ verbose, collapse }) => {
  Client.setLogger(getLogger({ name: 'packages/operator' }));
  Client.setConfigSetting('initialize-with-discovery', true);
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
        title: '[Org1MSP] createCommit',
        task: async () => {
          const { disconnect, submit } = await org1Operator.submitOrEvaluateTx({
            fcn: 'createCommit',
            args: [
              'dev_test', // entityName
              `dev_test_${Math.floor(Math.random() * 10000)}`, // entityId
              '0', // version
              JSON.stringify([{ type: 'Created', payload: { name: 'me' } }])
            ],
            identity: 'admin-org1.example.com',
            asLocalhost: true,
            chaincodeId: 'eventstore'
          });

          return submit().then(result => {
            console.log('[Org1MSP] createCommit', result);
            disconnect();
          });
        }
      },
      {
        title: '[Org2MSP] createCommit',
        task: async () => {
          const { disconnect, submit } = await org2Operator.submitOrEvaluateTx({
            fcn: 'createCommit',
            args: [
              'dev_test', // entityName
              `dev_test_${Math.floor(Math.random() * 10000)}`, // entityId
              '0', // version
              JSON.stringify([{ type: 'Created', payload: { name: 'you' } }])
            ],
            identity: 'admin-org2.example.com',
            asLocalhost: true,
            chaincodeId: 'eventstore'
          });

          return submit().then(result => {
            console.log('[Org2MSP] createCommit', result);
            disconnect();
          });
        }
      },
      {
        title: '[Org1MSP] queryByEntityName',
        task: async () => {
          const {
            disconnect,
            evaluate
          } = await org1Operator.submitOrEvaluateTx({
            fcn: 'queryByEntityName',
            args: ['dev_test'],
            identity: 'admin-org1.example.com',
            asLocalhost: true,
            chaincodeId: 'eventstore'
          });

          return evaluate().then(result => {
            console.log('[Org1MSP] QueryByEntityName', result);
            disconnect();
          });
        }
      },
      {
        title: '[Org2MSP] queryByEntityName',
        task: async () => {
          const {
            disconnect,
            evaluate
          } = await org2Operator.submitOrEvaluateTx({
            fcn: 'queryByEntityName',
            args: ['dev_test'],
            identity: 'admin-org2.example.com',
            asLocalhost: true,
            chaincodeId: 'eventstore'
          });

          return evaluate().then(result => {
            console.log('[Org2MSP] QueryByEntityName', result);
            disconnect();
          });
        }
      }
    ],
    // @ts-ignore
    { renderer: verbose ? 'verbose' : UpdaterRenderer, collapse }
  );
})({ verbose: true, collapse: false }).then(tasks => {
  tasks.run().then(() => console.log('💯  Tasks execution done'));
});
