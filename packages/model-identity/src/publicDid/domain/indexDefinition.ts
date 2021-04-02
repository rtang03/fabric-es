import type { DidDocumentIndexDefinition } from '../types';

export const didDocumentIndexDefinition: DidDocumentIndexDefinition = {
  context: {},
  id: { index: { type: 'TEXT' } },
  controller: {},
  publicKey: { altName: 'publickey' },
  service: {},
  proof: {},
  keyAgreement: { altName: 'keyagr' },
  updated: {},
};
