import { Context } from 'fabric-contract-api';
import { Attribute } from './attribute';
import { CONTEXT } from './constant';

export interface Resource {
  key: string;
  contextAttrs?: Attribute[];
  mspAttrs?: Attribute[];
  entityAttrs?: Attribute[];
  resourceAttrs?: Attribute[];
}

export const createResource: (option: {
  context: Context;
  mspAttrs?: Attribute[];
  entityName: string;
  entityAttrs?: Attribute[];
  entityId: string;
  resourceAttrs?: Attribute[];
}) => Resource = ({
  context,
  mspAttrs,
  entityName,
  entityAttrs,
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

  if (invoker_mspid)
    contextAttrs.push({
      type: '1',
      key: CONTEXT.INVOKER_MSPID,
      value: invoker_mspid
    });

  if (invoker_id)
    contextAttrs.push({
      type: '1',
      key: CONTEXT.INVOKER_ID,
      value: invoker_id
    });

  if (subject_cn)
    contextAttrs.push({
      type: '1',
      key: CONTEXT.SUBJECT_CN,
      value: subject_cn
    });

  if (subject_orgname)
    contextAttrs.push({
      type: '1',
      key: CONTEXT.SUBJECT_ORGNAME,
      value: subject_orgname
    });

  if (subject_ouname)
    contextAttrs.push({
      type: '1',
      key: CONTEXT.SUBJECT_OUNAME,
      value: subject_ouname
    });

  if (issuer_cn)
    contextAttrs.push({ type: '1', key: 'issuer_cn', value: issuer_cn });

  if (issuer_orgname)
    contextAttrs.push({
      type: '1',
      key: CONTEXT.ISSUER_ORGNAME,
      value: issuer_orgname
    });

  return {
    key: `model/${invoker_mspid}/${entityName}/${entityId}`,
    contextAttrs,
    mspAttrs: mspAttrs || [],
    entityAttrs: entityAttrs || [],
    resourceAttrs: resourceAttrs || []
  };
};
