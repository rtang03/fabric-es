import { Context } from 'fabric-contract-api';
import { assign, values } from 'lodash';
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

    const newAttrs = {};
    resource.resourceAttrs.forEach(attr => (newAttrs[attr.key] = attr));
    const existingAttrs = {};
    attributes.forEach(attr => (existingAttrs[attr.key] = attr));
    const resultAttrs = values<Attribute>(assign({}, existingAttrs, newAttrs));

    return resultAttrs
      ? stateList<Attribute[]>(NS.RESOURCE_ATTRIBUTE, context).addState(
          resource.key,
          resultAttrs.map(attr => {
            if (attr.key === 'version') {
              let version = parseInt(attr.value as string, 10);
              return {
                type: '1',
                key: 'version',
                value: `${++version}`,
                immutable: false
              };
            }
            return attr;
          })
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
  deletePolicyById: async id =>
    id
      ? stateList(NS.POLICY, context).deleteStatesByKeyRange([
          JSON.stringify(id)
        ])
      : null,
  deletePolicyByIdSid: async (id, sid) =>
    id && sid
      ? stateList(NS.POLICY, context).deleteStateByKey(makeKey([id, sid]))
      : null,
  deleteReourceAttrByURI: async uri =>
    uri
      ? stateList(NS.RESOURCE_ATTRIBUTE, context).deleteStateByKey(
          makeKey(uri.split('/'))
        )
      : null,
  getMSPAttrByMSPID: async mspid =>
    mspid
      ? stateList<Attribute[]>(NS.MSP_ATTRIBUTE, context).getState(
          makeKey([mspid])
        )
      : null,
  getPolicyById: async id =>
    id
      ? stateList<Policy>(NS.POLICY, context).getQueryResult([
          JSON.stringify(id)
        ])
      : null,
  getPolicyByIdSid: async (id, sid) =>
    id && sid
      ? stateList<Policy>(NS.POLICY, context).getState(makeKey([id, sid]))
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
