import type { DidDocumentIndexDefinition } from '../types';

export const didDocumentIndexDefinition: DidDocumentIndexDefinition = {
  context: {},
  id: { index: { type: 'TEXT' } },
  controller: {},
  verificationMethod: { altName: 'verification' },
  service: {},
  created: {},
  updated: {},
  proof: {},
  keyAgreement: { altName: 'keyagr' },
  // mandatory field "ts" in Redis
  _ts: { altName: 'ts', index: { type: 'NUMERIC', sortable: true } },
};
