import { Context } from 'fabric-contract-api';
import { Attribute, CONTEXT, Resource } from '../types';
import { makeKey } from './makeKey';

export const createMSPResource: (option: {
  context: Context;
  mspId: string;
  mspAttrs: Attribute[];
}) => Resource = ({ context, mspId, mspAttrs }) => {
  if (!mspId || !context || !mspAttrs) {
    return null;
  }

  const cid = context.clientIdentity;
  const contextAttrs: Attribute[] = [];

  // todo: replace with optional chaining to avoid TypeError: cannot read property of undefined
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
    key: JSON.stringify(mspId),
    uri: `msp/${mspId}`,
    contextAttrs,
    mspAttrs: mspAttrs || []
  };
};
