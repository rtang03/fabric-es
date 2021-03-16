import type { CredentialCommandHandler, CredentialRepo } from '../types';

export const credentialCommandHandler: (option: {
  enrollmentId: string;
  credentialRepo: CredentialRepo;
}) => CredentialCommandHandler = ({ enrollmentId, credentialRepo }) => ({
  IssueCredential: async () => {
    return null;
  },
  DeriveCredential: async () => {
    return null;
  },
  ProvePresentation: async () => {
    return null;
  },
  UpdateCredentialStatus: async () => {
    return null;
  },
  VerifyCredential: async () => {
    return null;
  },
  VerifyPresentation: async () => {
    return null;
  },
});
