import type { LoanDetailsDataSource } from './index';

export type LoanDetailsContext = {
  dataSources: { loanDetails: LoanDetailsDataSource };
  username: string;
};
