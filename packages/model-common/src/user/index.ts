import { Repository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
import { UserCommands } from './domain/commands';
import { UserEvents } from './domain/events';
import { User } from './domain/model';
import { CommandHandler } from '..';

export * from './domain/model';
export * from './domain/events';
export * from './domain/commands';
export * from './domain/reducer';
export * from './domain/handler';
export { typeDefs as userTypeDefs, resolvers as userResolvers } from './typeDefs';
export * from './queries';
export type UserRepo = Repository<User, UserEvents>;
export type UserCommandHandler = CommandHandler<UserCommands>;
export type UserDS = DataSrc<User, UserEvents>;
