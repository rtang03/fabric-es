import type { LoanIndexDefinition } from '../types';

export const loanIndexDefinition: LoanIndexDefinition = {
  comment: {},
  description: { altName: 'de', index: { type: 'TEXT' } },
  id: { index: { type: 'TEXT', sortable: true } },
  loanId: { index: { type: 'TEXT' } },
  ownerId: { altName: 'owner', index: { type: 'TEXT', sortable: true } },
  reference: { altName: 'ref' },
  status: { index: { type: 'TEXT' } },
  timestamp: { altName: 'ts', index: { type: 'NUMERIC', sortable: true } },
};
