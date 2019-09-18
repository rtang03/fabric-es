import { ProposalResponse } from 'fabric-client';
import { flatten } from 'lodash';
import '../env';
import { Context } from './types';
import { enrolAdmin, getClientForOrg, parseConnectionProfile } from './utils';

export const joinChannel: (
  channelName: string,
  peers?: string[],
  context?: Context
) => Promise<ProposalResponse[]> = async (
  channelName,
  peers,
  context = {
    pathToConnectionNetwork: process.env.PATH_TO_CONNECTION_PROFILE,
    pathToNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  const { pathToConnectionNetwork } = context;
  const client = await getClientForOrg(
    pathToConnectionNetwork,
    process.env.PATH_TO_CONNECTION_ORG1_CLIENT
  );
  const channel = client.getChannel(channelName);
  if (!channel)
    throw new Error(
      `Channel was not defined in the connection profile: ${channelName}`
    );
  const profile = await parseConnectionProfile(context);
  const txId = client.newTransactionID(true);
  const block = await channel.getGenesisBlock({ txId });
  const promises = [];
  const hubs = [];
  const { getOrgs } = profile.getOrganizations();
  for (const { orgName, mspid, peers, clientPath } of getOrgs()) {
    const admin = await getClientForOrg(pathToConnectionNetwork, clientPath);
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
    hubs.push(...channel.getChannelEventHubsForOrg(mspid));
    // todo: implement event hub listening
  }
  return Promise.all<ProposalResponse[]>(promises).then(results => {
    if (JSON.stringify(results).includes('error')) {
      throw flatten(results);
    } else return flatten(results);
  });
};
