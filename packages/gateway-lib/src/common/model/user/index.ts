import { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '../../..';
import { UserCommands } from './domain/commands';
import { UserEvents } from './domain/events';
import { User } from './domain/model';

export * from './domain/model';
export * from './domain/events';
export * from './domain/indices';
export * from './domain/commands';
export * from './domain/handler';
export * from './domain/reducer';
export * from './domain/typeGuard';

export { resolvers as userResolvers } from './service/resolvers';
export * from './service/schema';

export * from './query/createUser';
export * from './query/getCommitsByUserId';
export * from './query/getPaginatedUser';
export * from './query/getUserById';

export type UserRepo = Repository<User, UserEvents>;
export type UserCommandHandler = CommandHandler<UserCommands>;
export type UserDataSource = DataSrc<UserRepo>;

export type UserContext = {
  dataSources: { user: UserDataSource };
  username: string;
};
