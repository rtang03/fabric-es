import { Context } from 'fabric-contract-api';
import { makeKey } from '../utils';
import { Attribute } from './attribute';
import { CONTEXT } from './constant';

export interface Resource {
  key: string;
  uri: string;
  contextAttrs?: Attribute[];
  mspAttrs?: Attribute[];
  resourceAttrs?: Attribute[];
}

export const createResource: (option: {
  context: Context;
  mspAttrs?: Attribute[];
  entityName: string;
  entityId: string;
  resourceAttrs?: Attribute[];
}) => Resource = ({
  context,
  mspAttrs,
  entityName,
  entityId,
  resourceAttrs
}) => {
  const cid = context.clientIdentity;
  const contextAttrs: Attribute[] = [];
  const invoker_mspid = cid.getMSPID();
  const invoker_id = cid.getID();
  const subject_cn = cid.getX509Certificate().subject.commonName;
  const subject_orgname = cid.getX509Certificate().subject.organizationName;
  const subject_ouname = cid.getX509Certificate().subject
    .organizationalUnitName;
  const issuer_cn = cid.getX509Certificate().issuer.commonName;
  const issuer_orgname = cid.getX509Certificate().issuer.organizationName;
  const attr = (key, value) =>
    value ? { type: '1' as any, key, value } : null;

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

  return {
    key: makeKey(['model', invoker_mspid, entityName, entityId]),
    uri: `model/${invoker_mspid}/${entityName}/${entityId}`,
    contextAttrs,
    mspAttrs: mspAttrs || [],
    resourceAttrs: resourceAttrs || []
  };
};
