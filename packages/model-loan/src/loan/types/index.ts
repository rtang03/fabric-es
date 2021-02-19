import type { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import type { LoanCommands } from './commands';
import type { LoanEvents } from './events';
import type { Loan } from './loan';

export * from './commands';
export * from './events';
export * from './loan';
export * from './indexDefinition';
export * from './loanInRedis';
export * from './outputLoan';
export * from './loanContext';

export type LoanRepo = Repository<Loan, LoanEvents>;
export type LoanCommandHandler = CommandHandler<LoanCommands>;
export type LoanDataSource = DataSrc<LoanRepo>;
