import * as Client from 'fabric-client';
import { readFileSync } from 'fs';
import { join } from 'path';
import '../env';
import { Context } from '../../../../deployments/dev-net/config';
import { createUser, getClientForOrg, parseConnectionProfile } from './utils';

export const createChannel: (
  channelName: string,
  context?: Context
) => Promise<any> = async (
  channelName,
  context = {
    connectionProfile: process.env.PATH_TO_CONNECTION_PROFILE,
    channelTx: process.env.PATH_TO_CHANNEL_CONFIG,
    fabricNetwork: process.env.PATH_TO_NETWORK
  }
) => {
  const logger = Client.getLogger('CREATE_CHANNEL');
  const { channelTx, connectionProfile } = context;
  const client: Client = await getClientForOrg(connectionProfile);

  // create orderer
  const { getOrderer, getOrganizations } = await parseConnectionProfile(
    context
  );
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
    readFileSync(join(__dirname, channelTx, `${channelName}.tx`))
  );
  logger.debug('Extract channel.tx');
  const signatures = [];
  for (const { orgName } of getOrgs()) {
    const admin = await getClientForOrg(connectionProfile);
    signatures.push(
      await createUser(admin, orgName, context).then(() =>
        admin.signChannelConfig(config)
      )
    );
  }
  return channel.getGenesisBlock().then(
    () => {
      logger.info(`Got genesis block. Channel: ${channelName} already exists`);
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
          logger.info(`Channel ${channelName} does not exist yet`);
          if (result.status === 'SUCCESS') {
            return result;
          } else {
            logger.error('Failed to create the channel.');
            throw new Error('Failed to create the channel.');
          }
        })
  );
};
