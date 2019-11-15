import { CommandHandler } from '@espresso/common';
import { PrivatedataRepository } from '@espresso/fabric-cqrs';
import { LoanDetailsCommands } from './commands';
import { LoanDetailsEvents } from './events';
import { LoanDetails } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export type LoanDetailsRepo = PrivatedataRepository<LoanDetails, LoanDetailsEvents>;
export type LoanDetailsCommandHandler = CommandHandler<LoanDetailsCommands>;
