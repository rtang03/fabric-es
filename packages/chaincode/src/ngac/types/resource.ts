import { Context } from 'fabric-contract-api';
import { Attribute } from './attribute';
import { CONTEXT } from './constant';

export interface Resource {
  key: string;
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
  const getAttr = (key, value) => ({ type: '1' as any, key, value });
  if (invoker_mspid)
    contextAttrs.push(getAttr(CONTEXT.INVOKER_MSPID, invoker_mspid));

  if (invoker_id) contextAttrs.push(getAttr(CONTEXT.INVOKER_ID, invoker_id));

  if (subject_cn) contextAttrs.push(getAttr(CONTEXT.SUBJECT_CN, subject_cn));

  if (subject_orgname)
    contextAttrs.push(getAttr(CONTEXT.SUBJECT_ORGNAME, subject_orgname));

  if (subject_ouname)
    contextAttrs.push(getAttr(CONTEXT.SUBJECT_OUNAME, subject_ouname));

  if (issuer_cn) contextAttrs.push(getAttr(CONTEXT.ISSUER_CN, issuer_cn));

  if (issuer_orgname)
    contextAttrs.push(getAttr(CONTEXT.ISSUER_ORGNAME, issuer_orgname));

  return {
    key: `model/${invoker_mspid}/${entityName}/${entityId}`,
    contextAttrs,
    mspAttrs: mspAttrs || [],
    resourceAttrs: resourceAttrs || []
  };
};
