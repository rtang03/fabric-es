import type { BaseEntity } from '@fabric-es/fabric-cqrs';

export type Issuer = {
  id: string;

  type: string;
};

export type VCLinkDataProof = {
  type: string;

  created: string;

  verificationMethod: string;

  proofPurpose: 'assertionMethod' | string;

  jws: string;
};

/**
 * @see https://github.com/w3c-ccg/vc-http-api/blob/master/docs/vc-http-api.yml
 */
export interface Credential extends BaseEntity {
  /** "https://www.w3.org/2019/did/v1" **/
  context: 'https://w3id.org/did/v1' | string | string[];

  id: string;

  type: string[];

  issuer: Issuer;

  issuanceDate: string;

  expirationDate: string;

  credentialSubject: Record<string, unknown>;
}

export type VerificableCredential = Credential & {
  proof: VCLinkDataProof;
};
