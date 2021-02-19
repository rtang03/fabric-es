import { createStructuredSelector, Selector } from 'reselect';
import type { LoanInRedis, OutputLoan } from '../types';

export const postSelector: Selector<LoanInRedis, OutputLoan> = createStructuredSelector({
  id: (item) => item?.id,
  loanId: (item) => item?.id,
  ownerId: (item) => item?.owner,
  description: (item) => item?.de,
  reference: (item) => item?.ref,
  comment: (item) => item?.comment,
  status: (item) => item?.status,
  timestamp: (item) => item?.ts,
  createdAt: (item) => item?.created,
  creator: (item) => item?.creator,
});
