import { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
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
