/**
 * @packageDocumentation
 * @hidden
 */
export enum CONTEXT {
  ISSUER_ORGNAME = 'issuer_orgname',
  ISSUER_CN = 'issuer_cn',
  SUBJECT_OUNAME = 'subject_ouname',
  SUBJECT_ORGNAME = 'subject_orgname',
  SUBJECT_CN = 'subject_cn',
  INVOKER_ID = 'invoker_id',
  INVOKER_MSPID = 'invoker_mspid'
}

export enum RESOURCE {
  ENTITYNAME = 'entityName',
  ENTITYID = 'entityId',
  VERSION = 'version',
  CREATOR_MSPID = 'creator_mspid',
  CREATOR_CN = 'creator_cn',
  CREATOR_ID = 'creator_id'
}

export enum NAMESPACE {
  MODEL = 'model',
  ORG = 'org',
  ENTITY = 'entity',
  ENTITYID = 'entityid',
  MSP_ATTRIBUTE = 'mspattr',
  RESOURCE_ATTRIBUTE = 'resattr',
  POLICY = 'policy'
}
