import { ProposalResponse } from 'fabric-client';
import { flatten } from 'lodash';
import '../env';
import { Context } from './types';
import { createUser, getClientForOrg, parseConnectionProfile } from './utils';

export const joinChannel: (
  channelName: string,
  peers?: string[],
  context?: Context
) => Promise<ProposalResponse[]> = async (
  channelName,
  peers,
  context = {
    connectionProfile: process.env.PATH_TO_CONNECTION_PROFILE,
    fabricNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  const { connectionProfile } = context;
  const client = await getClientForOrg(connectionProfile);
  const channel = client.getChannel(channelName);
  if (!channel)
    throw new Error(
      `Channel was not defined in the connection profile: ${channelName}`
    );
  const { getOrgs } = await parseConnectionProfile(context).then(
    ({ getOrganizations }) => getOrganizations()
  );
  const txId = client.newTransactionID(true);
  const block = await channel.getGenesisBlock({ txId });
  const promises = [];
  // const hubs = [];
  for (const { orgName, peers, clientPath } of getOrgs()) {
    const admin = await getClientForOrg(clientPath);
    await createUser(admin, orgName, context).then(() => {
      const channel = admin.getChannel(channelName);
      promises.push(
        channel.joinChannel(
          {
            targets: peers,
            txId: admin.newTransactionID(true),
            block
          },
          60000
        )
      );
    });
    // hubs.push(
    //   ...admin.getChannel(channelName).getChannelEventHubsForOrg(mspid)
    // );
    // optionally, implement the registerBlockEvent of channel hub event
    // but join channnel does not really matter
  }
  return Promise.all<ProposalResponse[]>(promises).then(results => {
    if (JSON.stringify(results).includes('error')) {
      throw flatten(results);
    } else return flatten(results);
  });
};
