import Client from 'fabric-client';
import { readFileSync } from 'fs';
import { findLast } from 'lodash';
import { CreateNetworkOperatorOption, Queries } from '../types';
import { getClientForOrg } from '../utils';

export const getQueries = (option: CreateNetworkOperatorOption) => async ({
  peerName
}: {
  peerName: string;
}): Promise<Queries> => {
  // const logger = Client.getLogger('getQueries');
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
    getBlockByNumber: blockNumber => channel.queryBlock(blockNumber),
    getChainInfo: () => channel.queryInfo(peerName),
    getChannels: () => client.queryChannels(peerName),
    getInstalledChaincodes: () => client.queryInstalledChaincodes(peerName),
    getInstantiatedChaincodes: () =>
      channel.queryInstantiatedChaincodes(peerName),
    getInstalledCCVersion: chaincodeId =>
      client
        .queryInstalledChaincodes(peerName)
        .then(({ chaincodes }) =>
          findLast(chaincodes, ({ name }) => name === chaincodeId)
        )
        .then(result => result?.version),
    getMspid: async () => client.getMspid(),
    getTransactionByID: txId => channel.queryTransaction(txId),
    getCollectionsConfig: ({ chaincodeId, target }) =>
      channel.queryCollectionsConfig({ chaincodeId, target }),
    getChannelPeers: async () => channel.getChannelPeers()
  };
};
