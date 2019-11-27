import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { keys, values } from 'lodash';

interface OrgDetails {
  orgName: string;
  mspid: string;
  peers: string[];
  clientPath: string;
}

export const parseNetwork = async (option: { pathToConnProfile: string }) => {
  const profile = await yaml.safeLoad(
    Buffer.from(readFileSync(option.pathToConnProfile)).toString()
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
      getMSPIDByOrg: (orgName: string): string =>
        profile.organizations[orgName].mspid,
      getOrgs: (): OrgDetails[] =>
        keys(profile.organizations).map(orgName => ({
          orgName,
          mspid: profile.organizations[orgName].mspid,
          peers: profile.organizations[orgName].peers,
          clientPath: profile.organizations[orgName].client.path
        }))
    }),
    getPeers: () => ({
      getPeerHostnames: () => keys(profile.peers),
      getUrl: () =>
        Object.entries<any>(profile.peers).map(([key, { url }]) => [key, url])
    })
  };
};
