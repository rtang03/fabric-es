import * as Client from 'fabric-client';
import { readFileSync } from 'fs';
import { join } from 'path';
import '../env';
import { Context } from './types';
import { enrolAdmin, getClientForOrg, parseConnectionProfile } from './utils';

export const createChannel: (
  channelName: string,
  context?: Context
) => Promise<any> = async (
  channelName,
  context = {
    pathToConnectionNetwork: process.env.PATH_TO_CONNECTION_PROFILE,
    pathToChannelTx: process.env.PATH_TO_CHANNEL_CONFIG,
    pathToNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  // load connection profile
  const client: Client = await getClientForOrg(
    context.pathToConnectionNetwork,
    process.env.PATH_TO_CONNECTION_ORG1_CLIENT
  );

  // create orderer
  const profile = await parseConnectionProfile(context);
  const { url, tlsCACertsPem, hostname } = profile.getOrderer();
  const orderer = client.newOrderer(url, {
    pem: tlsCACertsPem,
    'ssl-target-name-override': hostname
  });
  const channel = client.newChannel(channelName);
  channel.addOrderer(orderer);

  // enrol all org's admins, and sign channel configuration
  const config = client.extractChannelConfig(
    readFileSync(join(__dirname, context.pathToChannelTx, `${channelName}.tx`))
  );
  const { getOrgs } = profile.getOrganizations();
  const signatures = [];
  for (const { orgName } of getOrgs()) {
    signatures.push(
      await enrolAdmin(client, orgName, context).then(() =>
        client.signChannelConfig(config)
      )
    );
  }
  return await channel.getGenesisBlock().then(
    () => {
      console.log(`Got genesis block. Channel: ${channelName} already exists`);
      return { status: 'SUCCESS' };
    },
    async () =>
      // userContext is the latest enrolled admin
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
