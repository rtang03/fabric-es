import { Context } from 'fabric-contract-api';
import { isEqual } from 'lodash';
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
  const type: any = '1';
  const attr = (key, value, immutable = true) =>
    value ? { type, key, value, immutable } : null;
  const mspAttrs = await ngacRepo(context).getAttrByMSPID(
    clientIdentity.getMSPID()
  );
  let resourceAttrs: Attribute[] = [];
  const id = clientIdentity.getID();
  const cn = clientIdentity.getX509Certificate().subject.commonName;
  const mspid = clientIdentity.getMSPID();
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
        attrs.forEach(item => resourceAttrs.push(item));
      }

      const eventsJson: any[] = JSON.parse(evenStr);
      const policies = await ngacRepo(context).getPolicyById(id);
      return isEqual(policies, [])
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
