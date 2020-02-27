import { Network } from 'fabric-network';
import { evaluateNgac, submitNgac } from '../../services';
import { NgacRepo } from '../../types';

export const ngacRepo: (network: Network) => NgacRepo = network => ({
  addPolicy: async ({ policyClass, sid, url, allowedEvents }) =>
    policyClass && sid && url && allowedEvents
      ? await submitNgac('addPolicy', [policyClass, sid, url, JSON.stringify(allowedEvents)], { network })
      : null,
  addMSPAttr: async ({ mspId, attributes }) =>
    mspId && attributes
      ? await submitNgac('addMSPAttr', [mspId, JSON.stringify(attributes)], {
          network
        })
      : null,
  addResourceAttr: async ({ entityName, entityId, attributes }) =>
    entityName && entityId && attributes
      ? await submitNgac('addResourceAttr', [entityName, entityId, JSON.stringify(attributes)], { network })
      : null,
  deleteMSPAttrByMSPID: async ({ mspId }) =>
    mspId ? await submitNgac('deleteMSPAttrByMSPID', [mspId], { network }) : null,
  deletePolicyById: async ({ x509Id }) => (x509Id ? await submitNgac('deletePolicyById', [x509Id], { network }) : null),
  deletePolicyByIdSid: async ({ x509Id, sid }) =>
    x509Id && sid ? await submitNgac('deletePolicyByIdSid', [x509Id, sid], { network }) : null,
  deleteReourceAttrByURI: async ({ uri }) =>
    uri ? await submitNgac('deleteReourceAttrByURI', [uri], { network }) : null,
  upsertResourceAttr: async ({ entityName, entityId, attributes }) =>
    entityName && entityId && attributes
      ? await submitNgac('upsertResourceAttr', [entityName, entityId, JSON.stringify(attributes)], { network })
      : null,
  getMSPAttrByMSPID: async ({ mspId }) =>
    mspId ? await evaluateNgac('getMSPAttrByMSPID', [mspId], { network }) : null,
  getPolicyById: async ({ x509Id }) => (x509Id ? await evaluateNgac('getPolicyById', [x509Id], { network }) : null),
  getPolicyByIdSid: async ({ x509Id, sid }) =>
    x509Id && sid ? await evaluateNgac('getPolicyByIdSid', [x509Id, sid], { network }) : null,
  getResourceAttrByURI: async ({ uri }) => (uri ? await evaluateNgac('getResourceAttrByURI', [uri], { network }) : null)
});
