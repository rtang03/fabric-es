import { ProposalResponse } from 'fabric-client';
import { flatten } from 'lodash';
import '../env';
import { Context } from './types';
import { enrolAdmin, getClientForOrg, connectionProfile } from './utils';

export const joinChannel: (
  channelName: string,
  peers?: string[],
  context?: Context
) => Promise<ProposalResponse[]> = async (
  channelName,
  peers,
  context = {
    connProfileNetwork: process.env.PATH_TO_CONNECTION_PROFILE,
    pathToNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  const { connProfileNetwork } = context;
  const client = await getClientForOrg(
    connProfileNetwork,
    process.env.PATH_TO_CONNECTION_ORG1_CLIENT
  );
  const channel = client.getChannel(channelName);
  if (!channel)
    throw new Error(
      `Channel was not defined in the connection profile: ${channelName}`
    );
  const { getOrgs } = await connectionProfile(context).then(
    ({ getOrganizations }) => getOrganizations()
  );
  const txId = client.newTransactionID(true);
  const block = await channel.getGenesisBlock({ txId });
  const promises = [];
  // const hubs = [];
  for (const { orgName, mspid, peers, clientPath } of getOrgs()) {
    const admin = await getClientForOrg(connProfileNetwork, clientPath);
    await enrolAdmin(admin, orgName, context).then(() => {
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
