import { PrivatedataRepository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
import { CommandHandler } from '@espresso/gw-node';
import { LoanDetailsCommands } from './commands';
import { LoanDetailsEvents } from './events';
import { LoanDetails } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export { typeDefs as loanDetailsTypeDefs, resolvers as loanDetailsResolvers } from './typeDefs';
export * from './queries';
export type LoanDetailsRepo = PrivatedataRepository<LoanDetails, LoanDetailsEvents>;
export type LoanDetailsCommandHandler = CommandHandler<LoanDetailsCommands>;
export type LoanDetailsDS = DataSrc<LoanDetails, LoanDetailsEvents>;
