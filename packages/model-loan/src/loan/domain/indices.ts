import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { Loan } from '.';

export type CommonLoanFields = Pick<
  Loan,
  'id' | 'ownerId' | 'loanId' | 'description' | 'status' | 'reference' | 'comment' | 'timestamp'
>;

export type LoanIndices = RedisearchDefinition<CommonLoanFields>;

export const loanIndices: LoanIndices = {
  comment: {},
  description: { altName: 'de', index: { type: 'TEXT' } },
  id: { index: { type: 'TEXT', sortable: true } },
  loanId: { index: { type: 'TEXT' } },
  ownerId: { altName: 'owner', index: { type: 'TEXT', sortable: true } },
  reference: { altName: 'ref' },
  status: { index: { type: 'TEXT' } },
  timestamp: { index: { type: 'NUMERIC', sortable: true } },
};
