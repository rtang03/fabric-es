import { Context } from 'fabric-contract-api';
import stateList from './ledger-api/statelist';
import {
  Attribute,
  NAMESPACE as NS,
  NgacRepo,
  Policy,
  Resource
} from './types';
import { makeKey } from './utils';

export const ngacRepo: (context: Context) => NgacRepo = context => ({
  addMSPAttr: async resource =>
    await stateList(NS.MSP_ATTRIBUTE, context).addState(resource),
  addResourceAttr: async resource =>
    await stateList<Resource>(NS.RESOURCE_ATTRIBUTE, context).addState(
      resource
    ),
  // tested
  addPolicy: async policy =>
    await stateList(NS.POLICY, context).addState(policy),
  // tested
  getMSPAttrByMSPID: async mspid =>
    await stateList(NS.MSP_ATTRIBUTE, context).getState(makeKey([mspid])),
  // tested
  getResourceAttrByURI: async uri =>
    await stateList<Attribute>(NS.RESOURCE_ATTRIBUTE, context).getQueryResult(
      uri.split('/').map(part => JSON.stringify(part))
    ),
  // tested
  getPolicyById: async x509id =>
    await stateList<Policy>(NS.POLICY, context).getQueryResult([
      JSON.stringify(x509id)
    ]),
  // tested
  getPolicyByIdSid: async (x509id, sid) =>
    await stateList<Policy>(NS.POLICY, context).getState(makeKey([x509id, sid]))
});
