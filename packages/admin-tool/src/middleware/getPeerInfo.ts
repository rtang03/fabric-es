import { Block, BlockchainInfo } from 'fabric-client';
import { findLast } from 'lodash';
import { Context } from './types';
import { createUser, getClientForOrg, parseConnectionProfile } from './utils';

interface SdkClientQuery {
  getBlockByNumber: (blockNumber) => Promise<Block>;
  getBlockByHash: (hash) => Promise<any>;
  getChainInfo: () => Promise<BlockchainInfo>;
  getChannels: () => Promise<any>;
  getInstalledChaincodes: () => Promise<any>;
  getInstantiatedChaincodes: () => Promise<any>;
  getInstalledCCVersion: (chaincodeId: string) => Promise<string>;
  getMspid: () => Promise<string>;
  getTransactionByID: (txId) => Promise<any>;
}

export const getPeerInfo: (
  channelName: string,
  peer?: string,
  context?: Context
) => Promise<SdkClientQuery> = async (
  channelName,
  peer = 'peer0.org1.example.com',
  context = {
    connectionProfile: process.env.PATH_TO_CONNECTION_ORG1,
    fabricNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  const { connectionProfile } = context;
  const profile = await parseConnectionProfile(context);
  const { getOrgs } = profile.getOrganizations();
  const { orgName } = getOrgs()[0];
  const client = await getClientForOrg(connectionProfile);
  return createUser(client, orgName, context).then(() => {
    const channel = client.getChannel(channelName);
    if (!channel) {
      console.error('No channel');
      throw new Error(
        `Channel was not defined in the connection profile: ${channelName}`
      );
    }
    return {
      getBlockByHash: async hash => channel.queryBlockByHash(hash),
      getBlockByNumber: async blockNumber => channel.queryBlock(blockNumber),
      getChainInfo: async () => channel.queryInfo(peer),
      getChannels: async () => client.queryChannels(peer),
      getInstalledChaincodes: async () => client.queryInstalledChaincodes(peer),
      getInstantiatedChaincodes: async () =>
        channel.queryInstantiatedChaincodes(peer),
      getInstalledCCVersion: async (cc: string) =>
        client
          .queryInstalledChaincodes(peer)
          .then(({ chaincodes }) =>
            findLast(chaincodes, ({ name }) => name === cc)
          )
          .then(({ version }) => version),
      getMspid: async () => client.getMspid(),
      getTransactionByID: async txId => channel.queryTransaction(txId)
      // get: async () => cli
    };
  });
};
