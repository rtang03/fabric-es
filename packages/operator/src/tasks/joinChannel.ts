import Client, { ProposalErrorResponse, ProposalResponse } from 'fabric-client';
import { readFileSync } from 'fs';
import { CreateNetworkOperatorOption, MISSING_TARGETS } from '../types';
import { getClientForOrg } from '../utils';
import util from 'util';

export const joinChannel = (option: CreateNetworkOperatorOption) => async ({
  targets,
  timeout
}: {
  targets: string[];
  timeout?: number;
}): Promise<ProposalResponse[] | ProposalErrorResponse[]> => {
  const logger = Client.getLogger('joinChannel.js');

  if (!targets) throw new Error(MISSING_TARGETS);

  const {
    channelName,
    ordererName,
    ordererTlsCaCert,
    connectionProfile,
    fabricNetwork
  } = option;

  const client = await getClientForOrg(connectionProfile, fabricNetwork);

  const channel = client.getChannel(channelName);

  let pem;

  try {
    pem = Buffer.from(readFileSync(ordererTlsCaCert)).toString();
  } catch (e) {
    logger.error(util.format('fail to read pem, %j', e));
    throw new Error(e);
  }

  channel.addOrderer(
    client.newOrderer(client.getOrderer(ordererName).getUrl(), {
      pem,
      'ssl-target-name-override': client.getOrderer(ordererName).getName()
    })
  );

  let block;

  try {
    block = await channel.getGenesisBlock({
      txId: client.newTransactionID()
    });
  } catch (e) {
    logger.error(util.format('fail to get genesis block, %j', e));
    throw new Error(e);
  }

  const txId = client.newTransactionID(true);

  return channel.joinChannel({ block, txId, targets }, timeout);
};
