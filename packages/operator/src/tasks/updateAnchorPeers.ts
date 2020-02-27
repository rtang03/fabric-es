import { readFileSync } from 'fs';
import util from 'util';
import Client, { BroadcastResponse } from 'fabric-client';
import { CreateNetworkOperatorOption, MISSING_CONFIG_TX } from '../types';
import { getClientForOrg } from '../utils';

export const updateAnchorPeers = (option: CreateNetworkOperatorOption) => async ({
  configUpdatePath
}: {
  configUpdatePath: string;
}): Promise<BroadcastResponse> => {
  const logger = Client.getLogger('updateAnchorPeers.js');

  if (!configUpdatePath) throw new Error(MISSING_CONFIG_TX);

  const { connectionProfile, channelName, ordererName, ordererTlsCaCert, fabricNetwork } = option;

  const client = await getClientForOrg(connectionProfile, fabricNetwork);

  const channel = client.getChannel(channelName);

  let pem;

  try {
    pem = Buffer.from(readFileSync(ordererTlsCaCert)).toString();
  } catch (e) {
    logger.error(util.format('fail to read pem, %j', e));
    throw new Error(e);
  }
  const orderer = client.newOrderer(client.getOrderer(ordererName).getUrl(), {
    pem,
    'ssl-target-name-override': client.getOrderer(ordererName).getName()
  });

  channel.addOrderer(orderer);

  const txId = client.newTransactionID(true);

  let envelope = null;

  try {
    envelope = readFileSync(configUpdatePath);
  } catch (e) {
    logger.error(util.format('fail to read envelope, %j', e));
    throw new Error(e);
  }

  let config = null;

  try {
    config = client.extractChannelConfig(envelope);
  } catch (e) {
    logger.error(util.format('fail to extractChannelConfig, %j', e));
    throw new Error(e);
  }

  let signature = null;

  try {
    signature = client.signChannelConfig(config);
  } catch (e) {
    logger.error(util.format('fail to signChannelConfig, %j', e));
    throw new Error(e);
  }

  return client.updateChannel({
    name: option.channelName,
    config,
    signatures: [signature],
    orderer,
    txId
  });
};
