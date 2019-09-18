import { Context } from './types';
import { getClientForOrg } from './utils';

export const instantiateChaincode: (
  chaincode: string,
  context?: Context
) => Promise<any> = async (
  chaincode,
  context = { pathToConnectionNetwork: process.env.PATH_TO_CONNECTION_PROFILE }
) => {
  const { pathToConnectionNetwork } = context;
  const client = await getClientForOrg(
    pathToConnectionNetwork,
    process.env.PATH_TO_CONNECTION_ORG1_CLIENT
  );
};
