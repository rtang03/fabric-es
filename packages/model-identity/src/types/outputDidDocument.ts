import type { BaseOutputEntity } from '@fabric-es/fabric-cqrs';
import type { ServiceEndpoint, VerificationMethod } from 'did-resolver';
import type { LinkedDataProof } from './didDocument';

export class OutputDidDocument implements BaseOutputEntity {
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

  /** Standard metadata for identifier records includes a timestamp of the original creation. **/
  created: string;

  /** Standard metadata for identifier records includes a timestamp of the most recent change **/
  updated: string;

  /** A proof on a DID Document is cryptographic proof of the integrity of the DID Document **/
  proof?: LinkedDataProof;

  keyAgreement?: (string | VerificationMethod)[];

  deactivated?: boolean;

  versionId?: string;
}
