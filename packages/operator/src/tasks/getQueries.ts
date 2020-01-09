import { readFileSync } from 'fs';
import { findLast } from 'lodash';
import { CreateNetworkOperatorOption, Queries } from '../types';
import { getClientForOrg } from '../utils';

export const getQueries = (option: CreateNetworkOperatorOption) => async ({
  peerName
}: {
  peerName: string;
}): Promise<Queries> => {
  const {
    connectionProfile,
    fabricNetwork,
    channelName,
    ordererTlsCaCert,
    ordererName
  } = option;
  const client = await getClientForOrg(connectionProfile, fabricNetwork);
  const channel = client.getChannel(channelName);
  const orderer = client.newOrderer(client.getOrderer(ordererName).getUrl(), {
    pem: Buffer.from(readFileSync(ordererTlsCaCert)).toString(),
    'ssl-target-name-override': client.getOrderer(ordererName).getName()
  });
  channel.addOrderer(orderer);

  return {
    getBlockByNumber: async blockNumber => channel.queryBlock(blockNumber),
    getChainInfo: async () => channel.queryInfo(peerName),
    getChannels: async () => client.queryChannels(peerName),
    getInstalledChaincodes: async () =>
      client.queryInstalledChaincodes(peerName),
    getInstantiatedChaincodes: async () =>
      channel.queryInstantiatedChaincodes(peerName),
    getInstalledCCVersion: async chaincodeId =>
      client
        .queryInstalledChaincodes(peerName)
        .then(({ chaincodes }) =>
          findLast(chaincodes, ({ name }) => name === chaincodeId)
        )
        .then(({ version }) => version),
    getMspid: async () => client.getMspid(),
    getTransactionByID: async txId => channel.queryTransaction(txId),
    getCollectionsConfig: async ({ chaincodeId, target }) =>
      channel.queryCollectionsConfig({ chaincodeId, target }),
    getChannelPeers: async () => channel.getChannelPeers()
  };
};
