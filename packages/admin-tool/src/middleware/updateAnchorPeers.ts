import '../env';
import { Context } from './types';
import { getClientForOrg } from './utils';

const Client = require('fabric-client');

export const updateAnchorPeers: (
  option: {
    channelName: string;
  },
  context?: Context
) => Promise<any> = async (
  { channelName },
  context = { connectionProfile: process.env.PATH_TO_CONNECTION_PROFILE }
) => {
  const logger = Client.getLogger('UPDATE_ANCHOR_PEER');
  const { connectionProfile } = context;
  const client = await getClientForOrg(connectionProfile);
  const channel = client.getChannel(channelName);
  if (!channel)
    throw new Error(
      `Channel was not defined in the connection profile: ${channelName}`
    );

};
