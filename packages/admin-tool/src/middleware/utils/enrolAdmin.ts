import * as Client from 'fabric-client';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Context } from '../types';
import { parseConnectionProfile } from './parseConnectionProfile';

const readAllFiles = (dir: string) => {
  const files = readdirSync(dir);
  const certs: Buffer[] = [];
  files.forEach(filename => {
    certs.push(readFileSync(join(dir, filename)));
  });
  return certs;
};

export const enrolAdmin = async (
  client: Client,
  orgName: string,
  context: Context
) => {
  const { pathToNetwork } = context;
  const keyPath = join(
    __dirname,
    `${pathToNetwork}/${orgName}/admin/msp/keystore`
  );
  const keyPEM = Buffer.from(readAllFiles(keyPath)[0]);
  const certPath = join(
    __dirname,
    `${pathToNetwork}/${orgName}/admin/msp/signcerts`
  );
  const certPEM = readAllFiles(certPath)[0];
  const { getOrganizations } = await parseConnectionProfile(context);
  const mspid = getOrganizations().getMSPIDByOrg(orgName);
  return Promise.resolve(
    // client is setUserContext with pre-existing crypto material
    client.createUser({
      username: `${orgName}Admin`,
      mspid,
      cryptoContent: {
        privateKeyPEM: keyPEM.toString(),
        signedCertPEM: certPEM.toString()
      },
      skipPersistence: false
    })
  );
};
