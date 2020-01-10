require('../env');
import execa from 'execa';
import Client, { ProposalErrorResponse, ProposalResponse } from 'fabric-client';
import { FileSystemWallet } from 'fabric-network';
import Listr from 'listr';
import { createNetworkOperator } from '../createNetworkOperator';
import { enrollAdmin } from '../enrollAdmin';
import { DeploymentOption } from '../types';
import { isProposalErrorResponse, isProposalResponse, logger } from '../utils';

const bootstrap: (option?: DeploymentOption) => Promise<Listr> = async (
  option = { renderer: 'verbose', collapse: false }
) => {
  Client.setLogger(logger);
  Client.setConfigSetting('initialize-with-discovery', true);
  const { renderer, collapse } = option;
  const walletOrg1 = new FileSystemWallet('./assets/walletOrg1');
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

  return null;
};

bootstrap().then(tasks =>
  tasks
    .run()
    .then(() => {
      console.log('💯  cc:"eventstore", channel:"eventstore" is upgraded');
    })
    .catch(error => {
      console.error(error);
      process.exit(-1);
    })
);
