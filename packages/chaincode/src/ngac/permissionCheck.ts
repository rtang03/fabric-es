import { Context } from 'fabric-contract-api';
import { ngacRepo } from './ngacRepo';
import { Assertion, policyDecisionEngine } from './policyDecisionEngine';
import {
  Attribute,
  CONTEXT,
  createResource,
  NAMESPACE,
  RESOURCE
} from './types';

enum FCN {
  CREATE_COMMIT = 'createCommit',
  QUERY_BY_ENTITYID = 'queryByEntityId',
  QUERY_BY_ENTITYID_COMMITID = 'queryByEntityIdCommitId',
  DELETE_BY_ENTITYID_COMMITID = 'deleteByEntityIdCommitId',
  DELETE_BY_ENTITYID = 'deleteByEntityId'
}

export const permissionCheck: ({
  policyClass,
  context
}: {
  policyClass?: string;
  context: Context;
}) => Promise<Assertion[]> = async ({ context, policyClass }) => {
  const { stub, clientIdentity } = context;
  const { fcn, params } = stub.getFunctionAndParameters();
  const getAttr = (key, value, immutable = true) => ({
    type: '1' as any,
    key,
    value,
    immutable
  });
  const mspAttrs = await ngacRepo(context).getAttrByMSPID(
    clientIdentity.getMSPID()
  );
  const resourceAttrs: Attribute[] = [];
  const id = clientIdentity.getID();
  const cn = clientIdentity.getX509Certificate().subject.commonName;
  const mspid = clientIdentity.getMSPID();
  return {
    [FCN.CREATE_COMMIT]: async (): Promise<Assertion[]> => {
      const [entityName, entityId, version, evenStr] = params;
      resourceAttrs.push(getAttr(CONTEXT.INVOKER_MSPID, mspid));
      resourceAttrs.push(getAttr(CONTEXT.INVOKER_ID, id));
      resourceAttrs.push(getAttr(CONTEXT.SUBJECT_CN, cn));
      resourceAttrs.push(getAttr(RESOURCE.VERSION, version, false));
      resourceAttrs.push(getAttr(RESOURCE.ENTITYNAME, entityName));
      resourceAttrs.push(getAttr(RESOURCE.ENTITYID, entityId));
      if (version === '0') {
        resourceAttrs.push(getAttr(RESOURCE.CREATOR_MSPID, mspid));
        resourceAttrs.push(getAttr(RESOURCE.CREATOR_CN, cn));
        resourceAttrs.push(getAttr(RESOURCE.CREATOR_ID, id));
      } else {
        const uri = `${NAMESPACE.MODEL}/${mspid}/${entityName}/${entityId}`;
        const attrs = await ngacRepo(context).getResourceAttrByURI(uri);
        resourceAttrs.push(...attrs);
      }
      const eventsJson: any[] = JSON.parse(evenStr);
      const policies = await ngacRepo(context).getPolicyById(id);
      return !policies
        ? [{ sid: 'system', assertion: false, message: 'No policy found' }]
        : policyDecisionEngine(policies, context).request({
            eventTypes: eventsJson.map(({ type }) => type),
            target: createResource({
              context,
              entityName,
              entityId,
              resourceAttrs,
              mspAttrs
            })
          });
    },
    [FCN.QUERY_BY_ENTITYID]: () =>
      Promise.resolve([{ sid: 'No policy required', assertion: true }]),
    [FCN.QUERY_BY_ENTITYID_COMMITID]: () =>
      Promise.resolve([{ sid: 'No policy required', assertion: true }]),
    [FCN.DELETE_BY_ENTITYID]: () =>
      Promise.resolve([{ sid: 'No policy required', assertion: true }]),
    [FCN.DELETE_BY_ENTITYID_COMMITID]: () =>
      Promise.resolve([{ sid: 'No policy required', assertion: true }])
  }[fcn]() as Promise<Assertion[]>;
};
