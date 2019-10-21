import { Context } from 'fabric-contract-api';
import stateList from './ledger-api/statelist';
import { Attribute, NAMESPACE as NS, NgacRepo, Policy } from './types';
import { makeKey } from './utils';

export const ngacRepo: (context: Context) => NgacRepo = context => ({
  addMSPAttr: async resource =>
    resource
      ? stateList<Attribute[]>(NS.MSP_ATTRIBUTE, context).addState(
          resource.key,
          resource.mspAttrs
        )
      : null,
  addResourceAttr: async resource =>
    resource
      ? stateList<Attribute[]>(NS.RESOURCE_ATTRIBUTE, context).addState(
          resource.key,
          resource.resourceAttrs
        )
      : null,
  upsertResourceAttr: async resource => {
    if (!resource) return null;
    const attributes = await stateList<Attribute[]>(
      NS.RESOURCE_ATTRIBUTE,
      context
    ).getState(resource.key);

    return attributes
      ? stateList<Attribute[]>(NS.RESOURCE_ATTRIBUTE, context).addState(
          resource.key,
          attributes.concat(resource.resourceAttrs)
        )
      : null;
  },
  addPolicy: async policy =>
    policy
      ? stateList<Policy>(NS.POLICY, context).addState(policy.key, policy)
      : null,
  deleteMSPAttrByMSPID: async mspid =>
    mspid
      ? stateList(NS.MSP_ATTRIBUTE, context).deleteStateByKey(makeKey([mspid]))
      : null,
  deletePolicyById: async x509id =>
    x509id
      ? stateList(NS.POLICY, context).deleteStatesByKeyRange([
          JSON.stringify(x509id)
        ])
      : null,
  deletePolicyByIdSid: async (x509id, sid) =>
    x509id && sid
      ? stateList(NS.POLICY, context).deleteStateByKey(makeKey([x509id, sid]))
      : null,
  deleteReourceAttrByURI: async uri =>
    uri
      ? stateList(NS.RESOURCE_ATTRIBUTE, context).deleteStatesByKeyRange(
          uri.split('/').map(part => JSON.stringify(part))
        )
      : null,
  getMSPAttrByMSPID: async mspid =>
    mspid
      ? stateList<Attribute[]>(NS.MSP_ATTRIBUTE, context).getState(
          makeKey([mspid])
        )
      : null,
  getPolicyById: async x509id =>
    x509id
      ? stateList<Policy>(NS.POLICY, context).getQueryResult([
          JSON.stringify(x509id)
        ])
      : null,
  getPolicyByIdSid: async (x509id, sid) =>
    x509id && sid
      ? stateList<Policy>(NS.POLICY, context).getState(makeKey([x509id, sid]))
      : null,
  getResourceAttrGroupByURI: async uri =>
    uri
      ? stateList<Attribute[]>(NS.RESOURCE_ATTRIBUTE, context).getQueryResult(
          uri.split('/').map(part => JSON.stringify(part))
        )
      : null,
  getResourceAttrByURI: async uri =>
    uri
      ? stateList<Attribute[]>(NS.RESOURCE_ATTRIBUTE, context).getState(
          makeKey(uri.split('/'))
        )
      : null
});
