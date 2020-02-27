import { Context } from 'fabric-contract-api';
import { Attribute, CONTEXT, Resource } from '../types';
import { createId } from './createId';
import { makeKey } from './makeKey';

export const createResource: (option: {
  context: Context;
  mspAttrs?: Attribute[];
  entityName: string;
  entityId?: string;
  resourceAttrs?: Attribute[];
}) => Resource = ({ context, mspAttrs, entityName, entityId, resourceAttrs }) => {
  if (!entityName || !context || !resourceAttrs) {
    return null;
  }
  const cid = context.clientIdentity;
  const contextAttrs: Attribute[] = [];

  // todo: replace with optional chaining to avoid TypeError: cannot read property of undefined
  const invoker_id = createId([cid.getMSPID(), cid.getX509Certificate().subject.commonName]);
  const invoker_mspid = cid.getMSPID();
  const subject_cn = cid.getX509Certificate().subject.commonName;
  const subject_orgname = cid.getX509Certificate().subject.organizationName;
  const subject_ouname = cid.getX509Certificate().subject.organizationalUnitName;
  const issuer_cn = cid.getX509Certificate().issuer.commonName;
  const issuer_orgname = cid.getX509Certificate().issuer.organizationName;
  const attr = (key, value) => (value ? { type: '1' as any, key, value } : null);

  contextAttrs.push(
    ...[
      attr(CONTEXT.INVOKER_MSPID, invoker_mspid),
      attr(CONTEXT.INVOKER_ID, invoker_id),
      attr(CONTEXT.SUBJECT_CN, subject_cn),
      attr(CONTEXT.SUBJECT_ORGNAME, subject_orgname),
      attr(CONTEXT.SUBJECT_OUNAME, subject_ouname),
      attr(CONTEXT.ISSUER_CN, issuer_cn),
      attr(CONTEXT.ISSUER_ORGNAME, issuer_orgname)
    ].filter(item => !!item)
  );

  return entityId
    ? {
        key: makeKey(['model', invoker_mspid, entityName, entityId]),
        uri: `model/${invoker_mspid}/${entityName}/${entityId}`,
        contextAttrs,
        mspAttrs: mspAttrs || [],
        resourceAttrs: resourceAttrs || []
      }
    : {
        key: makeKey(['model', invoker_mspid, entityName]),
        uri: `model/${invoker_mspid}/${entityName}`,
        contextAttrs,
        mspAttrs: mspAttrs || [],
        resourceAttrs: resourceAttrs || []
      };
};
