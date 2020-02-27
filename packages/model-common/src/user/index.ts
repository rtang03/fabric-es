import { Repository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
import { CommandHandler } from '..';
import { UserCommands } from './domain/commands';
import { UserEvents } from './domain/events';
import { User } from './domain/model';

export * from './domain/model';
export * from './domain/events';
export * from './domain/commands';
export * from './domain/reducer';
export * from './domain/handler';
export {
  typeDefs as userTypeDefs,
  resolvers as userResolvers
} from './typeDefs';
export * from './queries';
export type UserRepo = Repository<User, UserEvents>;
export type UserCommandHandler = CommandHandler<UserCommands>;
export type UserDS = DataSrc<User, UserEvents>;