import util from 'util';
import Client from 'fabric-client';
import { createAdmin } from './createAdmin';

export const getClientForOrg: (connectionProfile: string, fabricNewtork: string) => Promise<Client> = async (
  connectionProfile,
  fabricNetwork,
) => {
  const logger = Client.getLogger('[operator] getClientForOrg.js');
  const client = new Client();

  try {
    client.loadFromConfig(connectionProfile);
  } catch (e) {
    logger.error(util.format('fail to loadFromConfig, %j', e));
    throw new Error(e);
  }

  try {
    await client.initCredentialStores();
  } catch (e) {
    logger.error(util.format('fail to initCredentialStores, %j', e));
    throw new Error(e);
  }

  if (fabricNetwork) {
    try {
      await createAdmin({
        client,
        orgAdminMspPath: `${fabricNetwork}/${client.getMspid()}/admin/msp`
      });
    } catch (e) {
      logger.error(util.format('fail to createAdmin user context, %j', e));
      throw new Error(e);
    }
  }
  logger.info('loadFromConfig complete');

  return client;
};
