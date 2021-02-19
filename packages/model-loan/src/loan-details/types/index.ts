import type { PrivateRepository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import type { LoanDetailsCommands } from './commands';
import type { LoanDetailsEvents } from './events';
import type { LoanDetails } from './model';

export * from './events';
export * from './model';
export * from './commands';
export * from './loanDetailsContext';

export type LoanDetailsRepo = PrivateRepository<LoanDetails, LoanDetailsEvents>;
export type LoanDetailsCommandHandler = CommandHandler<LoanDetailsCommands>;
export type LoanDetailsDataSource = DataSrc<LoanDetailsRepo>;
