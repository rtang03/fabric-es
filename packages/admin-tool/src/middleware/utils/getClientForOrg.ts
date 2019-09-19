import * as Client from 'fabric-client';

export const getClientForOrg: (
  connProfileNetwork: string,
  connProfileClient: string
) => Promise<Client> = async (connProfileNetwork, connProfileClient) => {
  const client = new Client();
  await client.loadFromConfig(connProfileClient);
  await client.loadFromConfig(connProfileNetwork);
  await client.initCredentialStores();
  return client;
};
