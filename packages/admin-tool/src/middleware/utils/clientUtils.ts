import * as Client from 'fabric-client';
import { readdirSync, readFileSync } from 'fs';
import { keys } from 'lodash';
import { join } from 'path';
import { Context, NetworkConfig } from '../types';

const readAllFiles = (dir: string) => {
  const files = readdirSync(dir);
  const certs = [];
  files.forEach(filename => {
    certs.push(readFileSync(join(dir, filename)));
  });
  return certs;
};

export const clientUtils = (client: Client, context: Context) => ({
  allOrgs: client.getConfigSetting(context.networkId),
  peerOrgs: keys(client.getConfigSetting(context.networkId)).filter(
    org => org !== 'orderer'
  ) as string[],
  enrolAdmin: (org: string): Promise<Client.User> => {
    const { networkId, pathToNetwork } = context;
    const keyPath = join(
      __dirname,
      `${pathToNetwork}/${org}/admin/msp/keystore`
    );
    const keyPEM = Buffer.from(readAllFiles(keyPath)[0]);
    const certPath = join(
      __dirname,
      `${pathToNetwork}/${org}/admin/msp/signcerts`
    );
    const certPEM = readAllFiles(certPath)[0];
    const ORGS: NetworkConfig = client.getConfigSetting(networkId);
    return Promise.resolve(
      client.createUser({
        username: `peer${org}Admin`,
        mspid: ORGS[org].mspid,
        cryptoContent: {
          privateKeyPEM: keyPEM.toString(),
          signedCertPEM: certPEM.toString()
        },
        skipPersistence: false
      })
    );
  },
  getOrderer: () => {
    client.getConfigSetting(context.networkId);
    const { url, tls_cacerts, hostname } = clientUtils(
      client,
      context
    ).allOrgs.orderer;
    const pem = Buffer.from(
      readFileSync(join(__dirname, tls_cacerts))
    ).toString();
    return client.newOrderer(url, {
      pem,
      'ssl-target-name-override': hostname
    });
  }
});
