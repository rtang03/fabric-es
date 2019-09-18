import { ChaincodeType, ProposalResponse } from 'fabric-client';
import '../env';
import { Context } from './types';
import { connectionProfile, getClientForOrg } from './utils';

export const instantiateChaincode: (
  chaincode: {
    channelName: string;
    fcn?: string;
    args?: string[];
    chaincodeId?: string;
    chaincodeVersion?: string;
    upgrade?: boolean;
  },
  context?: Context
) => Promise<any> = async (
  {
    channelName,
    fcn = 'instantiate',
    args = [],
    chaincodeId,
    chaincodeVersion = '0',
    upgrade
  },
  context = { pathToConnectionNetwork: process.env.PATH_TO_CONNECTION_PROFILE }
) => {
  chaincodeId = (chaincodeId || channelName) as any;
  const { pathToConnectionNetwork } = context;
  const client = await getClientForOrg(
    pathToConnectionNetwork,
    process.env.PATH_TO_CONNECTION_ORG1_CLIENT
  );
  const channel = client.getChannel(channelName);
  if (!channel)
    throw new Error(
      `Channel was not defined in the connection profile: ${channelName}`
    );
  const { getPeerHostnames } = await connectionProfile(context).then(
    ({ getPeers }) => getPeers()
  );
  const txId = client.newTransactionID(true);
  const deployId = txId.getTransactionID();
  const request = {
    targets: getPeerHostnames(),
    chaincodeId,
    chaincodeVersion,
    chaincodeType: 'node' as ChaincodeType,
    fcn,
    args,
    txId
  };
  const simulation = upgrade
    ? await channel.sendUpgradeProposal(request, 120000)
    : await channel.sendInstantiateProposal(request, 120000);
  const proposalResponses: ProposalResponse[] = simulation[0] as any;
  const proposal = simulation[1];
  const allGood = proposalResponses.reduce(
    (previous, current) => previous && current!.response!.status === 200,
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
          const handler = setTimeout(() => hub.disconnect(), 60000);
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
    return await Promise.all<any>(promises)
      .then(res => res.pop())
      .then(res => (res!.status === 'SUCCESS' ? res : { error: res }));
  } else {
    return { error: 'Proposal failed' };
  }
};
