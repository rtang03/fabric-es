import type { LoanDetailsDataSource } from './index';

export type LoadDetailsContext = {
  dataSources: { loanDetails: LoanDetailsDataSource };
  username: string;
};
