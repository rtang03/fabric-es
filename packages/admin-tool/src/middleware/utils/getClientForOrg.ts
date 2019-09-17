import * as Client from 'fabric-client';

export const getClientForOrg: (
  pathToConnectionNetwork: string,
  pathToConnectionClient: string
) => Promise<Client> = async (
  pathToConnectionNetwork,
  pathToConnectionClient
) => {
  const client = new Client();
  await client.loadFromConfig(pathToConnectionClient);
  await client.loadFromConfig(pathToConnectionNetwork);
  await client.initCredentialStores();
  return client;
};
