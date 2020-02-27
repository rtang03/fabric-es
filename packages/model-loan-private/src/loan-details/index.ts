import { PrivatedataRepository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
import { CommandHandler } from '@espresso/model-common';
import { LoanDetailsCommands } from './domain/commands';
import { LoanDetailsEvents } from './domain/events';
import { LoanDetails } from './domain/model';

export * from './domain/model';
export * from './domain/events';
export * from './domain/commands';
export * from './domain/reducer';
export * from './domain/handler';
export { typeDefs as loanDetailsTypeDefs, resolvers as loanDetailsResolvers } from './typeDefs';
export { typeDefs as loanDetailsRemoteTypeDefs, resolvers as loanDetailsRemoteResolvers } from './remotes';
export * from './queries';
export type LoanDetailsRepo = PrivatedataRepository<LoanDetails, LoanDetailsEvents>;
export type LoanDetailsCommandHandler = CommandHandler<LoanDetailsCommands>;
export type LoanDetailsDS = DataSrc<LoanDetails, LoanDetailsEvents>;
