import type { VerificationMethod, ServiceEndpoint } from 'did-resolver';
import type { DidDocument, LinkedDataProof } from '../../types';

/**
 * @ignore
 */
export const isVerificationMethod = (input: any): input is VerificationMethod =>
  input?.id !== undefined && input?.type !== undefined && input?.controller !== undefined;

/**
 * @ignore
 */
export const isServiceEndPoint = (input: any): input is ServiceEndpoint =>
  input?.id !== undefined && input?.type !== undefined && input?.serviceEndpoint !== undefined;

/**
 * @ignore
 */
export const isLinkedDataProof = (input: any): input is LinkedDataProof =>
  input?.created !== undefined &&
  input?.type !== undefined &&
  input?.creator !== undefined &&
  input?.nonce !== undefined &&
  input?.signatureValue !== undefined;

/**
 * @ignore
 */
export const isDidDocument = (input: any): input is DidDocument =>
  input?.id !== undefined &&
  input?.context !== undefined &&
  input?.verificationMethod !== undefined;
