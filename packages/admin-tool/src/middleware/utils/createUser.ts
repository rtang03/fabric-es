import * as Client from 'fabric-client';
import { Context } from '../types';
import { parseConnectionProfile } from './connectionProfile';
import { readAllFiles } from './readAllFiles';

export const createUser: (
  client: Client,
  orgName: string,
  context: Context
) => Promise<Client.User> = async (client, orgName, context) =>
  parseConnectionProfile(context).then(({ getOrganizations }) =>
    client.createUser({
      username: `${orgName}Admin`,
      mspid: getOrganizations().getMSPIDByOrg(orgName),
      cryptoContent: {
        privateKeyPEM: Buffer.from(
          readAllFiles(
            `${context.fabricNetwork}/${orgName}/admin/msp/keystore`
          )[0]
        ).toString(),
        signedCertPEM: Buffer.from(
          readAllFiles(
            `${context.fabricNetwork}/${orgName}/admin/msp/signcerts`
          )[0]
        ).toString()
      },
      skipPersistence: true
    })
  );
