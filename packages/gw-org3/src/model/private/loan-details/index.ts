import { PrivateRepository } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { CommandHandler } from '@fabric-es/gateway-lib';
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
export type LoanDetailsRepo = PrivateRepository<LoanDetails, LoanDetailsEvents>;
export type LoanDetailsCommandHandler = CommandHandler<LoanDetailsCommands>;
export type LoanDetailsDS = DataSrc<LoanDetailsRepo>;
