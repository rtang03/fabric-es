import * as Client from 'fabric-client';
import { Context } from '../types';
import { parseConnectionProfile } from './connectionProfile';
import { readFile } from './readAllFiles';

export const createUser: (
  client: Client,
  orgName: string,
  context: Context
) => Promise<Client.User> = async (client, orgName, context) =>
  parseConnectionProfile(context).then(({ getOrganizations }) => {
    const orgs = getOrganizations();
    const { adminPrivateKeyPath, signedCertPath } = orgs.getOrgs()[0];
    return client.createUser({
      username: `${orgName}Admin`,
      mspid: orgs.getMSPIDByOrg(orgName),
      cryptoContent: {
        privateKeyPEM: Buffer.from(readFile(adminPrivateKeyPath)).toString(),
        signedCertPEM: Buffer.from(readFile(signedCertPath)).toString()
      },
      skipPersistence: true
    });
  });
