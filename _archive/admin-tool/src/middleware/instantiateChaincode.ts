import {
  ChaincodeInstantiateUpgradeRequest,
  ChaincodeType,
  ProposalResponse
} from 'fabric-client';
import '../env';
import { Context } from '../../../../deployments/dev-net/config';
import { getClientForOrg, parseConnectionProfile } from './index';

export const instantiateChaincode: (
  option: {
    channelName: string;
    fcn?: string;
    args?: string[];
    chaincodeId?: string;
    chaincodeVersion?: string;
    upgrade?: boolean;
    endorsementPolicy?: any;
    collectionsConfig?: string;
  },
  context?: Context
) => Promise<any> = async (
  {
    channelName,
    fcn = 'instantiate',
    args = [],
    chaincodeId,
    chaincodeVersion = '0',
    upgrade,
    endorsementPolicy,
    collectionsConfig
  },
  context = { connectionProfile: process.env.PATH_TO_CONNECTION_PROFILE }
) => {
  const { connectionProfile } = context;
  const client = await getClientForOrg(connectionProfile);
  const channel = client.getChannel(channelName);
  if (!channel)
    throw new Error(
      `Channel was not defined in the connection profile: ${channelName}`
    );
  const targets = await parseConnectionProfile(context).then(({ getPeers }) =>
    getPeers().getPeerHostnames()
  );
  const txId = client.newTransactionID(true);
  const deployId = txId.getTransactionID();
  const request: ChaincodeInstantiateUpgradeRequest = {
    targets,
    chaincodeId: chaincodeId || channelName,
    chaincodeVersion,
    chaincodeType: 'node' as ChaincodeType,
    fcn,
    args,
    txId
  };

  if (endorsementPolicy) {
    request['endorsement-policy'] = endorsementPolicy;
  }
  if (collectionsConfig) {
    request['collections-config'] = collectionsConfig;
  }

  const simulation = upgrade
    ? await channel.sendUpgradeProposal(request, 600000)
    : await channel.sendInstantiateProposal(request, 600000);
  const proposalResponses: ProposalResponse[] = simulation[0] as any;
  const proposal = simulation[1];
  const allGood = proposalResponses.reduce(
    (prev, curr) => prev && curr.response.status === 200,
    true
  );
  if (allGood) {
    const promises = [];
    // only 1 hub is returned, for Org1MSP, based on org1Admin client
    // in production deployment, it shall require different client (per org)
    // to obtain channel hub
    const hubs = channel.getChannelEventHubsForOrg();
    hubs.forEach(hub =>
      promises.push(
        new Promise((resolve, reject) => {
          const handler = setTimeout(() => hub.disconnect(), 600000);
          hub.registerTxEvent(
            deployId,
            (tid, code, blockNumber) => {
              console.log(
                `Instantiate or upgrade committed on peer ${hub.getPeerAddr()}`
              );
              console.log(`Tx ${tid} has status ${code} in blk ${blockNumber}`);
              clearTimeout(handler);
              if (code !== 'VALID')
                reject(
                  new Error('Instantiate or upgrade transaction was invalid')
                );
              else resolve('Instantiate or upgrade transaction was valid');
            },
            err => {
              clearTimeout(handler);
              console.error(err);
              reject(err);
            },
            // the default for 'unregister' is true for transaction listeners
            // so no real need to set here, however for 'disconnect'
            // the default is false as most event hubs are long running
            // in this use case we are using it only once
            { unregister: true, disconnect: true }
          );
          hub.connect();
        })
      )
    );
    promises.push(
      channel.sendTransaction({
        txId,
        proposal,
        proposalResponses
      })
    );
    return Promise.all<any>(promises)
      .then(res => res.pop())
      .then(res => (res!.status === 'SUCCESS' ? res : { error: res }));
  } else {
    return { error: 'Proposal failed' };
  }
};
