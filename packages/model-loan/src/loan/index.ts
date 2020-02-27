import { Repository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
import { CommandHandler } from '@espresso/model-common';
import { LoanCommands } from './domain/commands';
import { LoanEvents } from './domain/events';
import { Loan } from './domain/model';

export * from './domain/model';
export * from './domain/events';
export * from './domain/commands';
export * from './domain/reducer';
export * from './domain/handler';
export { typeDefs as loanTypeDefs, resolvers as loanResolvers } from './typeDefs';
export * from './queries';
export type LoanRepo = Repository<Loan, LoanEvents>;
export type LoanCommandHandler = CommandHandler<LoanCommands>;
export type LoanDS = DataSrc<Loan, LoanEvents>;
