import type { Credential, VerificableCredential } from './credential';
import type { Presentation } from './presentation';

type VerifyOptions = {
  verificationMethod: string;
  proofPurpose: 'assertionMethod' | string;
  created: string;
  challenge: string;
  domain: string;
};

/**
 * @see https://github.com/w3c-ccg/vc-http-api/blob/master/docs/vc-http-api.yml
 */
export type CredentialCommands = {
  // Issuer
  IssueCredential: {
    jobId: string;
    payload: {
      credential: Credential;
      options: {
        verificationMethod: string;
        proofPurpose: 'assertionMethod' | string;
        created: string;
        challenge: string;
        domain: string;
        credentialStatus: {
          type: string;
        };
      };
    };
  };
  // Holder
  DeriveCredential: {
    jobId: string;
    payload: {
      verifiableCredential: VerificableCredential;
      frame: Record<string, unknown>;
    };
  };
  // Issuer
  UpdateCredentialStatus: {
    jobId: string;
    payload: {
      credentialId: string;
      credentialStatus: [{ type: string; status: string }];
    };
  };
  // Holder
  ProvePresentation: {
    jobId: string;
    payload: {
      presentation: Presentation;
      options: {
        verificationMethod: string;
        proofPurpose: 'assertionMethod' | string;
        created: string;
        challenge: string;
        domain: string;
      };
    };
  };
  // Verifier
  VerifyCredential: {
    jobId: string;
    payload: {
      verifiableCredential: VerificableCredential;
      options: VerifyOptions;
    };
  };
  // Verifier
  VerifyPresentation: {
    jobId: string;
    payload: {
      verifiablePresentation: any;
      options: VerifyOptions;
    };
  };
};
