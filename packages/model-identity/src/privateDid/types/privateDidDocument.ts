import type { BaseEntity } from '@fabric-es/fabric-cqrs';
import type { DIDDocument } from 'did-resolver';
import type { ServiceEndpoint, VerificationMethod } from 'did-resolver';
import type { LinkedDataProof } from '../../types';

export class PrivateDidDocument implements DIDDocument, BaseEntity {
  static entityName = 'privateDidDocument';
  static parentName = 'didDocument';

  id: string;

  alsoKnownAs?: string[];

  controller?: string;

  verificationMethod?: VerificationMethod[];

  authentication?: (string | VerificationMethod)[];

  assertionMethod?: (string | VerificationMethod)[];

  // https://www.w3.org/2019/08/did-20190828/#service-endpoints
  service?: ServiceEndpoint[];

  /** Standard metadata for identifier records includes a timestamp of the original creation. **/
  created?: string;

  /** Standard metadata for identifier records includes a timestamp of the most recent change **/
  updated?: string;

  /** A proof on a DID Document is cryptographic proof of the integrity of the DID Document **/
  proof?: LinkedDataProof;

  keyAgreement?: (string | VerificationMethod)[];

  _ts: number;

  _created?: number;
}
