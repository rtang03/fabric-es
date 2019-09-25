import * as Client from 'fabric-client';

export const getClientForOrg: (
  connectionProfile: string
) => Promise<Client> = async connectionProfile => {
  const client = new Client();
  await client.loadFromConfig(connectionProfile);
  await client.initCredentialStores();
  return client;
};
