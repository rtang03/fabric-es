import type { Repository } from '@fabric-es/fabric-cqrs';
import type { CommandHandler } from '@fabric-es/gateway-lib';
import { DataSrc } from '@fabric-es/gateway-lib';
import type { LoanCommands } from './commands';
import type { LoanEvents } from './events';
import type { Loan } from './model';

export * from './model';
export * from './redis';
export * from './output';
export * from './events';
export * from './indices';
export * from './commands';
export * from './handler';
export * from './reducer';
export * from './typeGuard';

export type LoanRepo = Repository<Loan, LoanEvents>;
export type LoanCommandHandler = CommandHandler<LoanCommands>;
export type LoanDataSource = DataSrc<LoanRepo>;

export type LoanContext = {
  dataSources: { loan: LoanDataSource };
  username: string;
};
