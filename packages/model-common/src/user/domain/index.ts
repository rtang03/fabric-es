
import type { Repository } from '@fabric-es/fabric-cqrs';
import type { CommandHandler } from '@fabric-es/gateway-lib';
import { DataSrc } from '@fabric-es/gateway-lib';
import type { UserCommands } from './commands';
import type { UserEvents } from './events';
import type { User } from './model';

export * from './model';
export * from './events';
export * from './indices';
export * from './commands';
export * from './handler';
export * from './reducer';
export * from './typeGuard';

export type UserRepo = Repository<User, UserEvents>;
export type UserCommandHandler = CommandHandler<UserCommands>;
export type UserDataSource = DataSrc<UserRepo>;

export type UserContext = {
  dataSources: { user: UserDataSource };
  username: string;
};
