import { Repository } from '@espresso/fabric-cqrs';
import { CommandHandler } from '..';
import { UserCommands } from './commands';
import { UserEvents } from './events';
import { User } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export type UserRepo = Repository<User, UserEvents>;
export type UserCommandHandler = CommandHandler<UserCommands>;