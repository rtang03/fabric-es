import { BroadcastResponse } from 'fabric-client';
import { readFileSync } from 'fs';
import { CreateNetworkOperatorOption, MISSING_CONFIG_TX } from '../types';
import { getClientForOrg } from '../utils';

export const updateAnchorPeers = (
  option: CreateNetworkOperatorOption
) => async ({
  configUpdatePath
}: {
  configUpdatePath: string;
}): Promise<BroadcastResponse> => {
  if (!configUpdatePath) throw new Error(MISSING_CONFIG_TX);

  const {
    connectionProfile,
    channelName,
    ordererName,
    ordererTlsCaCert,
    fabricNetwork
  } = option;
  const client = await getClientForOrg(connectionProfile, fabricNetwork);
  const channel = client.getChannel(channelName);
  const orderer = client.newOrderer(client.getOrderer(ordererName).getUrl(), {
    pem: Buffer.from(readFileSync(ordererTlsCaCert)).toString(),
    'ssl-target-name-override': client.getOrderer(ordererName).getName()
  });
  channel.addOrderer(orderer);

  const txId = client.newTransactionID(true);
  const envelope = readFileSync(configUpdatePath);
  const config = client.extractChannelConfig(envelope);
  const signature = client.signChannelConfig(config);

  return client.updateChannel({
    name: option.channelName,
    config,
    signatures: [signature],
    orderer,
    txId
  });
};
