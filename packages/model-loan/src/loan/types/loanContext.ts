import type { LoanDataSource } from './index';

export type LoanContext = {
  dataSources: { loan: LoanDataSource };
  username: string;
};
