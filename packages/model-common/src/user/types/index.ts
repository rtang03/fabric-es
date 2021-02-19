import type { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import type { UserCommands } from './commands';
import type { UserEvents } from './events';
import type { User } from './user';

export * from './commands';
export * from './events';
export * from './user';
export * from './apolloContext';
export * from './indexDefinition';

export type UserRepo = Repository<User, UserEvents>;
export type UserCommandHandler = CommandHandler<UserCommands>;
export type UserDataSource = DataSrc<UserRepo>;
