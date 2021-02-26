import type { PrivateRepository } from '@fabric-es/fabric-cqrs';
import type { CommandHandler } from '@fabric-es/gateway-lib';
import { DataSrc } from '@fabric-es/gateway-lib';
import type { LoanDetailsCommands } from './commands';
import type { LoanDetailsEvents } from './events';
import type { LoanDetails } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './handler';
export * from './reducer';

export type LoanDetailsRepo = PrivateRepository<LoanDetails, LoanDetailsEvents>;
export type LoanDetailsCommandHandler = CommandHandler<LoanDetailsCommands>;
export type LoanDetailsDataSource = DataSrc<LoanDetailsRepo>;

export type LoanDetailsContext = {
  dataSources: { loanDetails: LoanDetailsDataSource };
  username: string;
};
