import * as Client from 'fabric-client';
import { Context } from '../types';
import { connectionProfile } from './connectionProfile';
import { readAllFiles } from './readAllFiles';

export const enrollCAAdmin: (
  client: Client,
  orgName: string,
  context: Context
) => Promise<Client.User> = async (client, orgName, context) =>
  connectionProfile(context).then(({ getOrganizations }) =>
    client.createUser({
      username: `${orgName}CAAdmin`,
      mspid: getOrganizations().getMSPIDByOrg(orgName),
      cryptoContent: {
        privateKeyPEM: Buffer.from(
          readAllFiles(
            `${context.fabricNetwork}/${orgName}/ca/admin/msp/keystore`
          )[0]
        ).toString(),
        signedCertPEM: Buffer.from(
          readAllFiles(
            `${context.fabricNetwork}/${orgName}/ca/admin/msp/signcerts`
          )[0]
        ).toString()
      },
      skipPersistence: false
    })
  );
