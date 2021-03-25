import type { ServiceEndpoint, VerificationMethod } from 'did-resolver';
import type { LinkedDataProof } from './didDocument';

export type CreateDidOption = {
  context?: 'https://w3id.org/did/v1' | string | string[];
  id: string;
  controller?: string;
  controllerKey: string;
  service?: ServiceEndpoint[];
  created?: string;
  updated?: string;
  proof?: LinkedDataProof;
  keyAgreement?: (string | VerificationMethod)[];
};
