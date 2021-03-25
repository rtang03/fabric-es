import { createStructuredSelector, Selector } from 'reselect';
import type { LoanInRedis } from '.';

/**
 * **LoanOutput** represents the advance search result transformed from the domain entity *Loan*.
 * It is optional if the output object has the same structure as the entity stored in Redis.
 */
export interface LoanOutput {
  id: string;
  loanId: string;
  ownerId: string;
  description: string;
  reference: string;
  comment: string;
  status: string;
}

/**
 * **loanPostSelector** transform the domain entity cached in Redis into search result format.
 */
export const loanPostSelector: Selector<LoanInRedis, LoanOutput> = createStructuredSelector({
  id: (item) => item?.id,
  loanId: (item) => item?.id,
  ownerId: (item) => item?.owner,
  description: (item) => item?.de,
  reference: (item) => item?.ref,
  comment: (item) => item?.comment,
  status: (item) => item?.status,
});
