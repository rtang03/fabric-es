import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { keys, values } from 'lodash';
import { Context } from '../types';

export const parseConnectionProfile = async ({ pathToConnection }: Context) => {
  const profile = await yaml.safeLoad(
    Buffer.from(readFileSync(pathToConnection)).toString()
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
      getMSPIDByOrg: orgName => profile.organizations[orgName].mspid,
      getOrgs: () => keys(profile.organizations)
    })
  };
};
