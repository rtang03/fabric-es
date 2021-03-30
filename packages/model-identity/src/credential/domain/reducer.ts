import type { Credential, CredentialEvents } from '../types';

export const credentialReducer = (cred: Credential, event: CredentialEvents): Credential => {
  switch (event.type) {
    case 'CredentialIssued':
      return { ...cred };
    default:
      return cred;
  }
};
