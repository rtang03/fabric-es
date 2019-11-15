import { Repository } from '@espresso/fabric-cqrs';
import { CommandHandler } from '..';
import { LoanCommands } from './commands';
import { LoanEvents } from './events';
import { Loan } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export type LoanRepo = Repository<Loan, LoanEvents>;
export type LoanCommandHandler = CommandHandler<LoanCommands>;
