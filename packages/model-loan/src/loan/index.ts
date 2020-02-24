import { Repository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
import { CommandHandler } from '@espresso/model-common';
import { LoanCommands } from './commands';
import { LoanEvents } from './events';
import { Loan } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export {
  typeDefs as loanTypeDefs,
  resolvers as loanResolvers
} from './typeDefs';
export * from './queries';
export type LoanRepo = Repository<Loan, LoanEvents>;
export type LoanCommandHandler = CommandHandler<LoanCommands>;
export type LoanDS = DataSrc<Loan, LoanEvents>;
