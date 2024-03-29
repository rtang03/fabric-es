import type { BaseEntity } from '@fabric-es/fabric-cqrs';
import type { DIDDocument, VerificationMethod, ServiceEndpoint } from 'did-resolver';

/**
 * The value of the publicKey property MUST be an array of public keys, and every public key property MUST be in the
 * @see https://w3c-ccg.github.io/ld-cryptosuite-registry/
 */

// @see https://w3c-ccg.github.io/ld-proofs/
export type LinkedDataProof = {
  type: string;

  created: string;

  // creator: string;
  nonce: string;

  proofPurpose?: string;

  verificationMethod?: string;

  domain?: string;

  signatureValue: string;
};

// @see https://github.com/decentralized-identity/did-resolver/blob/master/src/resolver.ts
export class DidDocument implements DIDDocument, BaseEntity {
  static entityName = 'didDocument';

  /** "https://www.w3.org/2019/did/v1" **/
  context: 'https://w3id.org/did/v1' | string | string[];

  // "id": "did:example:21tDAKCERh95uGgKbJNHYp"
  id: string;

  alsoKnownAs?: string[];

  controller?: string;

  publicKey: VerificationMethod[];

  authentication?: (string | VerificationMethod)[];

  assertionMethod?: (string | VerificationMethod)[];

  // https://www.w3.org/2019/08/did-20190828/#service-endpoints
  service?: ServiceEndpoint[];

  /** Standard metadata for identifier records includes a timestamp of the most recent change **/
  updated: string;

  /** A proof on a DID Document is cryptographic proof of the integrity of the DID Document **/
  proof?: LinkedDataProof;

  keyAgreement?: (string | VerificationMethod)[];

  deactivated?: boolean;

  versionId?: string;
}
