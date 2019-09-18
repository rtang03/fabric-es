import { flatten } from 'lodash';
import '../env';
import { Context } from './types';
import { getClientForOrg, parseConnectionProfile } from './utils';

export const installChaincode: (
  chaincode: {
    chaincodeId: string;
    chaincodeVersion?: string;
  },
  context?: Context
) => Promise<any> = async (
  { chaincodeId, chaincodeVersion = '0' },
  context = { pathToConnectionNetwork: process.env.PATH_TO_CONNECTION_PROFILE }
) => {
  const { pathToConnectionNetwork } = context;
  const chaincodePath = process.env.PATH_TO_CHAINCODE || '../chaincode';
  const profile = await parseConnectionProfile(context);
  const promises = [];
  const { getOrgs } = profile.getOrganizations();
  for (const { peers, clientPath } of getOrgs()) {
    const admin = await getClientForOrg(pathToConnectionNetwork, clientPath);
    const txId = admin.newTransactionID(true);
    promises.push(
      admin.installChaincode(
        {
          targets: peers,
          chaincodeId,
          chaincodePath,
          chaincodeType: 'node',
          chaincodeVersion,
          txId
        },
        60000
      )
    );
  }
  return Promise.all(promises).then(results => {
    if (JSON.stringify(results).includes('error')) {
      throw flatten(results);
    } else return flatten(results);
  });
};
