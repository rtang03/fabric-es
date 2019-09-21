import * as Client from 'fabric-client';
import { readFileSync } from 'fs';
import { join } from 'path';
import '../env';
import { Context } from './types';
import { connectionProfile, enrollAdmin, getClientForOrg } from './utils';

export const createChannel: (
  channelName: string,
  context?: Context
) => Promise<any> = async (
  channelName,
  context = {
    connProfileNetwork: process.env.PATH_TO_CONNECTION_PROFILE,
    pathToChannelTx: process.env.PATH_TO_CHANNEL_CONFIG,
    pathToNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  const { pathToChannelTx, connProfileNetwork } = context;
  const client: Client = await getClientForOrg(connProfileNetwork);

  // create orderer
  const { getOrderer, getOrganizations } = await connectionProfile(context);
  const { url, tlsCACertsPem, hostname } = getOrderer();
  const { getOrgs } = getOrganizations();
  const orderer = client.newOrderer(url, {
    pem: tlsCACertsPem,
    'ssl-target-name-override': hostname
  });
  const channel = client.newChannel(channelName);
  channel.addOrderer(orderer);

  // enrol all org's admins, and sign channel configuration
  const config = client.extractChannelConfig(
    readFileSync(join(__dirname, pathToChannelTx, `${channelName}.tx`))
  );
  const signatures = [];
  for (const { orgName } of getOrgs()) {
    const admin = await getClientForOrg(connProfileNetwork);
    signatures.push(
      await enrollAdmin(admin, orgName, context).then(() =>
        admin.signChannelConfig(config)
      )
    );
  }
  return channel.getGenesisBlock().then(
    () => {
      console.log(`Got genesis block. Channel: ${channelName} already exists`);
      return { status: 'SUCCESS' };
    },
    async () =>
      await client
        .createChannel({
          config,
          signatures,
          name: channelName,
          orderer: hostname,
          txId: client.newTransactionID(true)
        })
        .then(result => {
          console.log(`Channel ${channelName} does not exist yet`);
          if (result.status === 'SUCCESS') {
            return result;
          } else throw new Error('Failed to create the channel.');
        })
  );
};
