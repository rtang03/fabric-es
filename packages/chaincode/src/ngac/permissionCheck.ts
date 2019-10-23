import { Context } from 'fabric-contract-api';
import { isEqual } from 'lodash';
import { ngacRepo } from './ngacRepo';
import { policyDecisionEngine } from './policyDecisionEngine';
import { postAssertion } from './postAssertion';
import { Assertion, Attribute, CONTEXT, NAMESPACE, RESOURCE } from './types';
import { createId, createResource } from './utils';

enum FCN {
  CREATE_COMMIT = 'createCommit',
  QUERY_BY_ENTITYID = 'queryByEntityId',
  QUERY_BY_ENTITYID_COMMITID = 'queryByEntityIdCommitId',
  DELETE_BY_ENTITYID_COMMITID = 'deleteByEntityIdCommitId',
  DELETE_BY_ENTITYID = 'deleteByEntityId',
  ADD_MSP_ATTR = 'addMSPAttr',
  ADD_RESORUCE_ATTR = 'addResourceAttr',
  ADD_POLICY = 'addPolicy',
  DELETE_MSP_ATTR_BY_MSPID = 'deleteMSPAttrByMSPID',
  DELETE_POLICY_BY_ID = 'deletePolicyById',
  DELETE_POLICY_BY_ID_SID = 'deletePolicyByIdSid',
  DELETE_RESOURCE_ATTR_BY_URI = 'deleteReourceAttrByURI',
  UPSERT_RESOURCE_ATTR = 'upsertResourceAttr',
  GET_MSP_ATTR_BY_MSPID = 'getMSPAttrByMSPID',
  GET_POLICY_BY_ID = 'getPolicyById',
  GET_POLICY_BY_ID_SID = 'getPolicyByIdSid',
  GET_RESOURCE_ATTR_BY_URI = 'getResourceAttrByURI'
}

const noPolicyRequired = Promise.resolve([
  { sid: 'system', message: 'No policy required', assertion: true }
]);

export const permissionCheck: (option: {
  policyClass?: string;
  context: Context;
}) => Promise<Assertion[]> = async ({ context, policyClass }) => {
  const { stub, clientIdentity } = context;
  const { fcn, params } = stub.getFunctionAndParameters();
  const type: any = '1';
  const attr = (key, value, immutable = true) =>
    value ? { type, key, value, immutable } : null;
  const mspAttrs = await ngacRepo(context).getMSPAttrByMSPID(
    clientIdentity.getMSPID()
  );
  let resourceAttrs: Attribute[] = [];
  const cn = clientIdentity.getX509Certificate().subject.commonName;
  const mspid = clientIdentity.getMSPID();
  const id = createId([mspid, cn]);
  return {
    [FCN.CREATE_COMMIT]: async (): Promise<Assertion[]> => {
      const [entityName, entityId, version, evenStr] = params;
      resourceAttrs = [
        attr(CONTEXT.INVOKER_ID, id),
        attr(CONTEXT.INVOKER_MSPID, mspid),
        attr(CONTEXT.SUBJECT_CN, cn)
      ].filter(item => !!item);

      if (version === '0') {
        [
          attr(RESOURCE.VERSION, version, false),
          attr(RESOURCE.ENTITYNAME, entityName),
          attr(RESOURCE.ENTITYID, entityId),
          attr(RESOURCE.CREATOR_MSPID, mspid),
          attr(RESOURCE.CREATOR_CN, cn),
          attr(RESOURCE.CREATOR_ID, id)
        ]
          .filter(item => !!item)
          .forEach(item => resourceAttrs.push(item));
      } else {
        const uri = `${NAMESPACE.MODEL}/${mspid}/${entityName}/${entityId}`;
        const attrs = await ngacRepo(context).getResourceAttrByURI(uri);

        if (isEqual(attrs, [])) {
          return [
            { sid: 'system', assertion: false, message: 'No resource found' }
          ];
        } else attrs.forEach(item => resourceAttrs.push(item));
      }

      const eventsJson: any[] = JSON.parse(evenStr);
      const eventTypes = eventsJson.map(({ type }) => type);
      const policies = await ngacRepo(context).getPolicyById(id);
      const target = createResource({
        context,
        entityName,
        entityId,
        resourceAttrs,
        mspAttrs
      });
      return isEqual(policies, [])
        ? [{ sid: 'system', assertion: false, message: 'No policy found' }]
        : policyDecisionEngine(policies, context)
            .request({ eventTypes, target })
            .then(async assertions => {
              await postAssertion(assertions, target, context);
              return assertions;
            });
    },
    [FCN.QUERY_BY_ENTITYID]: () => noPolicyRequired,
    [FCN.QUERY_BY_ENTITYID_COMMITID]: () => noPolicyRequired,
    [FCN.DELETE_BY_ENTITYID]: () => noPolicyRequired,
    [FCN.DELETE_BY_ENTITYID_COMMITID]: () => noPolicyRequired,
    [FCN.ADD_MSP_ATTR]: () => noPolicyRequired,
    [FCN.ADD_RESORUCE_ATTR]: () => noPolicyRequired,
    [FCN.ADD_POLICY]: () => noPolicyRequired,
    [FCN.DELETE_POLICY_BY_ID]: () => noPolicyRequired,
    [FCN.DELETE_POLICY_BY_ID_SID]: () => noPolicyRequired,
    [FCN.DELETE_RESOURCE_ATTR_BY_URI]: () => noPolicyRequired,
    [FCN.DELETE_MSP_ATTR_BY_MSPID]: () => noPolicyRequired,
    [FCN.GET_POLICY_BY_ID]: () => noPolicyRequired,
    [FCN.GET_POLICY_BY_ID_SID]: () => noPolicyRequired,
    [FCN.GET_RESOURCE_ATTR_BY_URI]: () => noPolicyRequired,
    [FCN.GET_MSP_ATTR_BY_MSPID]: () => noPolicyRequired,
    [FCN.UPSERT_RESOURCE_ATTR]: () => noPolicyRequired
  }[fcn]() as Promise<Assertion[]>;
};
