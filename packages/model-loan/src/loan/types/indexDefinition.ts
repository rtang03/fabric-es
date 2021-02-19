import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { Loan } from '.';

export type CommonLoanFields = Pick<
  Loan,
  'id' | 'ownerId' | 'loanId' | 'description' | 'status' | 'reference' | 'comment' | 'timestamp'
>;

export type LoanIndexDefinition = RedisearchDefinition<CommonLoanFields>;
