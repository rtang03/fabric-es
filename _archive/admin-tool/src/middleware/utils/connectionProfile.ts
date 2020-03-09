import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { keys, values } from 'lodash';
import { Context } from '../../../../../deployments/dev-net/config';

interface OrgDetails {
  orgName: string;
  mspid: string;
  peers: string[];
  clientPath: string;
  adminPrivateKeyPath: string;
  signedCertPath: string;
}

export const parseConnectionProfile = async ({
  connectionProfile
}: Context) => {
  const profile = await yaml.safeLoad(
    Buffer.from(readFileSync(connectionProfile)).toString()
  );
  return {
    getOrderer: () => ({
      url: values(profile.orderers)[0].url,
      tlsCACerts: values(profile.orderers)[0].tlsCACerts.path,
      hostname: keys(profile.orderers)[0],
      tlsCACertsPem: Buffer.from(
        readFileSync(values(profile.orderers)[0].tlsCACerts.path)
      ).toString()
    }),
    getOrganizations: () => ({
      getMSPIDByOrg: (orgName): string => profile.organizations[orgName].mspid,
      getOrgs: (): OrgDetails[] =>
        keys(profile.organizations).map(orgName => ({
          orgName,
          mspid: profile.organizations[orgName].mspid,
          peers: profile.organizations[orgName].peers,
          clientPath: profile.organizations[orgName].client.path,
          adminPrivateKeyPath: profile.organizations[orgName].adminPrivateKey.path,
          signedCertPath: profile.organizations[orgName].signedCert.path
        }))
    }),
    getPeers: () => ({
      getPeerHostnames: () => keys(profile.peers)
    })
  };
};
