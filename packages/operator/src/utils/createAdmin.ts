import Client from 'fabric-client';
import { readFileSync } from 'fs';

export interface CreateAdminOption {
  client: Client;
  orgAdminMspPath: string;
}

export const createAdmin = async (
  option: CreateAdminOption
): Promise<Client.User> => {
  const { client, orgAdminMspPath } = option;
  const privateKeyPath = `${orgAdminMspPath}/keystore/key.pem`;
  const signCertPath = `${orgAdminMspPath}/signcerts/cert.pem`;

  return client.createUser({
    username: `${client.getMspid()}Admin`,
    mspid: client.getMspid(),
    cryptoContent: {
      privateKeyPEM: Buffer.from(readFileSync(privateKeyPath)).toString(),
      signedCertPEM: Buffer.from(readFileSync(signCertPath)).toString()
    },
    skipPersistence: true
  });
};
