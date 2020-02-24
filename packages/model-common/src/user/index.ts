import { Repository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
import { CommandHandler } from '..';
import { UserCommands } from './commands';
import { UserEvents } from './events';
import { User } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export {
  typeDefs as userTypeDefs,
  resolvers as userResolvers
} from './typeDefs';
export * from './queries';
export type UserRepo = Repository<User, UserEvents>;
export type UserCommandHandler = CommandHandler<UserCommands>;
export type UserDS = DataSrc<User, UserEvents>;