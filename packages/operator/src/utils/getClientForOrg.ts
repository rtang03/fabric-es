import Client from 'fabric-client';
import { createAdmin } from './createAdmin';

export const getClientForOrg: (
  connectionProfile: string,
  fabricNewtork?: string
) => Promise<Client> = async (connectionProfile, fabricNetwork) => {
  const client = new Client();
  await client.loadFromConfig(connectionProfile);
  await client.initCredentialStores();

  if (fabricNetwork)
    await createAdmin({
      client,
      orgAdminMspPath: `${fabricNetwork}/${client.getMspid()}/admin/msp`
    });

  return client;
};
