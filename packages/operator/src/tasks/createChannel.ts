import Client, { BroadcastResponse } from 'fabric-client';
import { readFileSync } from 'fs';
import { join } from 'path';
import util from 'util';
import {
  CHANNEL_ALREADY_EXIST,
  CreateNetworkOperatorOption,
  MISSING_CONFIG_TX
} from '../types';
import { getClientForOrg } from '../utils';

export const createChannel = (option: CreateNetworkOperatorOption) => async ({
  channelTxPath
}: {
  channelTxPath: string;
}): Promise<BroadcastResponse> => {
  if (!channelTxPath) throw new Error(MISSING_CONFIG_TX);

  const logger = Client.getLogger('createChannel.js');
  const {
    channelName,
    connectionProfile,
    ordererTlsCaCert,
    fabricNetwork,
    ordererName
  } = option;
  const client = await getClientForOrg(connectionProfile, fabricNetwork);
  const channel = client.newChannel(channelName);
  const hostname = client.getOrderer(ordererName).getName();

  channel.addOrderer(
    client.newOrderer(client.getOrderer(ordererName).getUrl(), {
      pem: Buffer.from(readFileSync(ordererTlsCaCert)).toString(),
      'ssl-target-name-override': hostname
    })
  );

  const signatures = [];
  const config = client.extractChannelConfig(
    readFileSync(join(channelTxPath, `${channelName}.tx`))
  );

  logger.info(`read file ${channelTxPath}/${channelName}.tx`);

  signatures.push(client.signChannelConfig(config));

  return channel
    .getGenesisBlock()
    .then(() => {
      logger.info(`${CHANNEL_ALREADY_EXIST}: ${channelName}`);
      return new Error(CHANNEL_ALREADY_EXIST);
    })
    .catch(async () => {
      const promises = [];
      // wait 5 seconds for channel creation
      promises.push(new Promise(resolve => setTimeout(resolve, 5000)));
      promises.push(
        client.createChannel({
          config,
          signatures,
          name: channelName,
          orderer: hostname,
          txId: client.newTransactionID(true)
        })
      );

      return Promise.all(promises).then(result => {
        logger.debug(util.format('createChannel result: %j', result));
        return result.pop();
      });
    });
};
