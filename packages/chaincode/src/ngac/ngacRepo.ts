import { Context } from 'fabric-contract-api';
import getStateList from './ledger-api/statelist';
import { Attribute, NAMESPACE, Policy } from './types';

export const ngacRepo: (
  context: Context
) => {
  getAttrByMSPID: (mspid: string) => Promise<Attribute[]>;
  getAttrByEntityName: (entityName: string) => Promise<Attribute[]>;
  getResourceAttrByKey: (key: string) => Promise<Attribute[]>;
  getPolicyById: (id: string) => Promise<Policy[]>;
} = context => ({
  getAttrByMSPID: async mspid =>
    await getStateList(NAMESPACE.MSP_ATTRIBUTE, context).getQueryResult([
      JSON.stringify(mspid)
    ]),
  getAttrByEntityName: async entityName =>
    await getStateList(NAMESPACE.ENTITY_ATTRIBUTE, context).getQueryResult([
      JSON.stringify(entityName)
    ]),
  getResourceAttrByKey: async key =>
    await getStateList(NAMESPACE.RESOURCE_ATTRIBUTE, context).getQueryResult([
      JSON.stringify(key)
    ]),
  getPolicyById: async id =>
    await getStateList(NAMESPACE.POLICY, context).getQueryResult([
      JSON.stringify(id)
    ])
});
