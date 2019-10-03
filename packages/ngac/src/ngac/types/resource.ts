import { Context } from 'fabric-contract-api';

export interface Tag {
  type: '1' | 'N';
  key: string;
  value: string | string[];
  alias?: string;
  disabled?: boolean;
}

export interface Resource {
  key: string;
  contextTags?: Tag[];
  projectTags?: Tag[];
  entityTags?: Tag[];
  resourceTags?: Tag[];
}

export const createResource: (option: {
  context: Context;
  projectTags?: Tag[];
  entityName: string;
  entityTags?: Tag[];
  entityId: string;
  resourceTags?: Tag[];
}) => Resource = ({
  context,
  projectTags,
  entityName,
  entityTags,
  entityId,
  resourceTags
}) => {
  const cid = context.clientIdentity;
  const contextTags: Tag[] = [];
  const invoker_mspid = cid.getMSPID();
  const invoker_id = cid.getID();
  const subject_cn = cid.getX509Certificate().subject.commonName;
  const subject_orgname = cid.getX509Certificate().subject.organizationName;
  const subject_ouname = cid.getX509Certificate().subject
    .organizationalUnitName;
  const issuer_cn = cid.getX509Certificate().issuer.commonName;
  const issuer_orgname = cid.getX509Certificate().issuer.organizationName;

  if (invoker_mspid)
    contextTags.push({
      type: '1',
      key: 'invoker_mspid',
      value: invoker_mspid
    });

  if (invoker_id)
    contextTags.push({ type: '1', key: 'invoker_id', value: invoker_id });

  if (subject_cn)
    contextTags.push({ type: '1', key: 'subject_cn', value: subject_cn });

  if (subject_orgname)
    contextTags.push({
      type: '1',
      key: 'subject_orgname',
      value: subject_orgname
    });

  if (subject_ouname)
    contextTags.push({
      type: '1',
      key: 'subject_ouname',
      value: subject_ouname
    });

  if (issuer_cn)
    contextTags.push({ type: '1', key: 'issuer_cn', value: issuer_cn });

  if (issuer_orgname)
    contextTags.push({
      type: '1',
      key: 'issuer_orgname',
      value: issuer_orgname
    });

  return {
    key: `model/${invoker_mspid}/${entityName}/${entityId}`,
    contextTags,
    projectTags: projectTags || [],
    entityTags: entityTags || [],
    resourceTags: resourceTags || []
  };
};
