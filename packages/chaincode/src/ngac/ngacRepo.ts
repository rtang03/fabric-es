import { Context } from 'fabric-contract-api';
import stateList from './ledger-api/statelist';
import { NAMESPACE, NgacRepo } from './types';

export const ngacRepo: (context: Context) => NgacRepo = context => ({
  getAttrByMSPID: async mspid =>
    await stateList(NAMESPACE.MSP_ATTRIBUTE, context).getQueryResult([
      JSON.stringify(mspid)
    ]),
  getResourceAttrByURI: async uri =>
    await stateList(NAMESPACE.RESOURCE_ATTRIBUTE, context).getQueryResult(
      uri.split('/').map(part => JSON.stringify(part))
    ),
  // getPolicyBy X509's id
  getPolicyById: async id =>
    await stateList(NAMESPACE.POLICY, context).getQueryResult([
      JSON.stringify(id)
    ]),
  addResourceAttr: async resource =>
    await stateList(NAMESPACE.RESOURCE_ATTRIBUTE, context).addState(resource)
});
