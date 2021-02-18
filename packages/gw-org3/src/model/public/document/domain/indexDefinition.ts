import type { DocumentIndexDefinition } from '../types';

export const documentIndexDefinition: DocumentIndexDefinition = {
  id: { index: { type: 'TEXT', sortable: true } },
  documentId: { altName: 'docId' },
  ownerId: { altName: 'owner', index: { type: 'TEXT', sortable: true } },
  loanId: { index: { type: 'TEXT' } },
  title: { index: { type: 'TEXT' } },
  status: { index: { type: 'TEXT' } },
  reference: { altName: 'ref' },
  timestamp: { altName: 'ts', index: { type: 'NUMERIC', sortable: true } },
  link: {},
};
