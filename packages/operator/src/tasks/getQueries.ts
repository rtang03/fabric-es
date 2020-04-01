import util from 'util';
import Client from 'fabric-client';
import { CreateNetworkOperatorOption, Queries } from '../types';
import { getClientForOrg, promiseToReadFile } from '../utils';

export const getQueries = (option: CreateNetworkOperatorOption) => async (): Promise<Queries> => {
  const logger = Client.getLogger('[operator] getQueries.js');
  const { connectionProfile, fabricNetwork, channelName, ordererTlsCaCert, ordererName } = option;
  const client = await getClientForOrg(connectionProfile, fabricNetwork);
  const channel = client.getChannel(channelName);

  let pem: string;
  let ordererUrl: string;

  try {
    pem = await promiseToReadFile(ordererTlsCaCert);
  } catch (e) {
    logger.error(util.format('fail to read ordererTlsCaCert, %j', e));
    throw new Error(e);
  }

  try {
    ordererUrl = client.getOrderer(ordererName).getUrl();
  } catch (e) {
    logger.error(util.format('fail to find orderer in connection profile, %j', e));
  }

  const orderer = client.newOrderer(ordererUrl, {
    pem,
    'ssl-target-name-override': client.getOrderer(ordererName).getName()
  });

  channel.addOrderer(orderer);

  return {
    getBlockByNumber: blockNumber => channel.queryBlock(blockNumber),
    getChainInfo: peerName => channel.queryInfo(peerName),
    getChannels: peerName => client.queryChannels(peerName),
    getMspid: () => client.getMspid(),
    getTransactionByID: txId => channel.queryTransaction(txId),
    getChannelPeers: async () => channel.getChannelPeers()
  };
};
