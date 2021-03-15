import type { VerificationMethod } from 'did-resolver';
import type { DidDocument, CreateDidOption } from '../types';

export const createDidDocument: (option: CreateDidOption) => DidDocument = ({
  context,
  id,
  controller,
  controllerKey,
  service,
  created,
  updated,
  proof,
  keyAgreement,
}) => {
  context = context
    ? Array.isArray(context)
      ? [...context, 'https://www.w3.org/ns/did/v1']
      : [context, 'https://www.w3.org/ns/did/v1']
    : 'https://www.w3.org/ns/did/v1';

  if (!id) throw new Error('Cannot construct DID document without id or subject');

  const identity = `did:fab:${id}`;
  const timestamp = Date.now();
  const isoTime = new Date(timestamp).toISOString();
  const authentication: VerificationMethod[] = [
    // sigAuth
    {
      id: `${identity}`,
      type: 'Secp256k1SignatureAuthentication2018',
      publicKeyHex: controllerKey,
      controller: identity,
    },
  ];
  const verificationMethod: VerificationMethod[] = [
    // sigAuth
    // {
    //   id: `${identity}`,
    //   type: 'Secp256k1SignatureAuthentication2018',
    //   publicKeyHex: controllerKey,
    //   controller: identity,
    // },
    // veriKey
    {
      id: `${identity}`,
      type: 'Secp256k1VerificationKey2018',
      publicKeyHex: controllerKey,
      controller: identity,
    },
  ];

  return {
    context,
    id: identity,
    controller: controller || identity,
    authentication,
    verificationMethod,
    service,
    created: created ?? isoTime,
    updated: updated ?? isoTime,
    proof,
    keyAgreement,
    _ts: null,
  };
};
