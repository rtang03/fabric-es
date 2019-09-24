import '../env';
import { Context } from './types';
import { connectionProfile, createUser, getClientForOrg } from './utils';

interface Query {
  getBlockByNumber: (blockNumber) => Promise<any>;
  getTransactionByID: (txId) => Promise<any>;
  getBlockByHash: (hash) => Promise<any>;
  getChainInfo: () => Promise<any>;
  getInstalledChaincodes: () => Promise<any>;
  getInstantiatedChaincodes: () => Promise<any>;
  getChannels: () => Promise<any>;
}

export const getInfo: (
  channelName: string,
  peer?: string,
  context?: Context
) => Promise<Query> = async (
  channelName,
  peer = 'peer0.org1.example.com',
  context = {
    connProfileNetwork: process.env.PATH_TO_CONNECTION_ORG1,
    fabricNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  const { connProfileNetwork } = context;
  const profile = await connectionProfile(context);
  const { getOrgs } = profile.getOrganizations();
  const { orgName } = getOrgs()[0];
  const client = await getClientForOrg(connProfileNetwork);
  return createUser(client, orgName, context).then(() => {
    const channel = client.getChannel(channelName);
    if (!channel)
      throw new Error(
        `Channel was not defined in the connection profile: ${channelName}`
      );
    return {
      getBlockByNumber: async blockNumber =>
        await channel.queryBlock(blockNumber),
      getTransactionByID: async txId => await channel.queryTransaction(txId),
      getBlockByHash: async hash => channel.queryBlockByHash(Buffer.from(hash)),
      getChainInfo: async () => channel.queryInfo(peer),
      getInstalledChaincodes: async () => client.queryInstalledChaincodes(peer),
      getInstantiatedChaincodes: async () =>
        channel.queryInstantiatedChaincodes(peer),
      getChannels: async () => client.queryChannels(peer)
    };
  });
};
