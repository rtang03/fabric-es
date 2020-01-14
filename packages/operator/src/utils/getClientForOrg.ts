import Client from 'fabric-client';
import { createAdmin } from './createAdmin';

export const getClientForOrg: (
  connectionProfile: string,
  fabricNewtork?: string
) => Promise<Client> = async (connectionProfile, fabricNetwork) => {
  const logger = Client.getLogger('getClientForOrg.js');
  const client = new Client();
  await client.loadFromConfig(connectionProfile);

  logger.info('loadFromConfig complete');

  await client.initCredentialStores();

  logger.info('initCredentialStores');

  if (fabricNetwork) {
    await createAdmin({
      client,
      orgAdminMspPath: `${fabricNetwork}/${client.getMspid()}/admin/msp`
    });

    logger.info('create "admin" user context');
  }

  return client;
};
