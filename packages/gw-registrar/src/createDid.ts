import type { Issuer } from 'did-jwt-vc';

export const createDid: (address: string, privateKey) => Issuer = (address, privateKey) => {
  return {
    did: 'null',
    alg: '',
    signer: async (data) => 'null',
  };
};
