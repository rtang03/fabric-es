import { Repository } from '@espresso/fabric-cqrs';
import { CommandHandler } from '..';
import { LoanCommands } from './commands';
import { LoanEvent } from './events';
import { Loan } from './model';

export * from './errors';
export * from './model';
export * from './events';
export * from './reducer';
export * from './commands';
export * from './handler';
export type LoanRepo = Repository<Loan, LoanEvent>;
export type LoanCommandHandler = CommandHandler<LoanCommands>;
