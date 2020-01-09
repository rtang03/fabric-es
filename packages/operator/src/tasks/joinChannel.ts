import { ProposalErrorResponse, ProposalResponse } from 'fabric-client';
import { readFileSync } from 'fs';
import { CreateNetworkOperatorOption, MISSING_TARGETS } from '../types';
import { getClientForOrg } from '../utils';

export const joinChannel = (option: CreateNetworkOperatorOption) => async ({
  targets,
  timeout
}: {
  targets: string[];
  timeout?: number
}): Promise<ProposalResponse[] | ProposalErrorResponse[]> => {
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

  channel.addOrderer(
    client.newOrderer(client.getOrderer(ordererName).getUrl(), {
      pem: Buffer.from(readFileSync(ordererTlsCaCert)).toString(),
      'ssl-target-name-override': client.getOrderer(ordererName).getName()
    })
  );

  const block = await channel.getGenesisBlock({
    txId: client.newTransactionID()
  });
  const txId = client.newTransactionID(true);

  return channel.joinChannel({ block, txId, targets }, timeout);
};
