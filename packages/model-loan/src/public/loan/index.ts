import { Repository } from '@espresso/fabric-cqrs';
import { CommandHandler, DataSrc } from '../..';
import { LoanCommands } from './commands';
import { LoanEvents } from './events';
import { Loan } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export { typeDefs as loanTypeDefs, resolvers as loanResolvers } from './datagraph';
export * from './queries';
export type LoanRepo = Repository<Loan, LoanEvents>;
export type LoanCommandHandler = CommandHandler<LoanCommands>;
export type LoanDS = DataSrc<Loan, LoanEvents>;
