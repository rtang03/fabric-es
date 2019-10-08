import { findLast } from 'lodash';
import '../env';
import { Context } from './types';
import { createUser, getClientForOrg, parseConnectionProfile } from './utils';

interface Query {
  getBlockByNumber: (blockNumber) => Promise<any>;
  getTransactionByID: (txId) => Promise<any>;
  getBlockByHash: (hash) => Promise<any>;
  getChainInfo: () => Promise<any>;
  getInstalledChaincodes: () => Promise<any>;
  getInstantiatedChaincodes: () => Promise<any>;
  getChannels: () => Promise<any>;
  getInstalledCCVersion: (chaincodeId: string) => Promise<string>;
}

export const getInfo: (
  channelName: string,
  peer?: string,
  context?: Context
) => Promise<Query> = async (
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
      getChannels: async () => client.queryChannels(peer),
      getInstalledCCVersion: async (cc: string) =>
        await client
          .queryInstalledChaincodes(peer)
          .then(({ chaincodes }) =>
            findLast(chaincodes, ({ name }) => name === cc)
          )
          .then(({ version }) => version)
    };
  });
};
