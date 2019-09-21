import { ProposalResponse } from 'fabric-client';
import { flatten } from 'lodash';
import '../env';
import { Context } from './types';
import { connectionProfile, getClientForOrg } from './utils';

export const installChaincode: (
  chaincode: {
    chaincodeId: string;
    chaincodeVersion?: string;
  },
  context?: Context
) => Promise<ProposalResponse[]> = async (
  { chaincodeId, chaincodeVersion = '0' },
  context = { connProfileNetwork: process.env.PATH_TO_CONNECTION_PROFILE }
) => {
  const { connProfileNetwork } = context;
  const chaincodePath = process.env.PATH_TO_CHAINCODE || '../chaincode';
  const { getOrgs } = await connectionProfile(context).then(
    ({ getOrganizations }) => getOrganizations()
  );
  const promises = [];
  for (const { peers, clientPath } of getOrgs()) {
    const admin = await getClientForOrg(clientPath);
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
  return Promise.all<ProposalResponse[]>(promises).then(results => {
    if (JSON.stringify(results).includes('error')) {
      console.log('Install chaincode fails');
      console.log(JSON.stringify(results).includes('error'));
      throw flatten(results);
    } else {
      return flatten(flatten(results)).filter(({ response }) => !!response);
    }
  });
};
