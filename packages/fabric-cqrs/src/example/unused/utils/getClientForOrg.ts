import * as Client from 'fabric-client';

export const getClientForOrg: (
  connProfileNetwork: string
) => Promise<Client> = async connProfileNetwork => {
  const client = new Client();
  await client.loadFromConfig(connProfileNetwork);
  await client.initCredentialStores();
  return client;
};
