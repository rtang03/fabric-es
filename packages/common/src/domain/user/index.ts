import { Repository } from '@espresso/fabric-cqrs';
import { CommandHandler } from '..';
import { UserCommands } from './commands';
import { UserEvent } from './events';
import { User } from './model';

export * from './model';
export * from './events';
export * from './reducer';
export * from './commands';
export * from './handler';
export type UserRepo = Repository<User, UserEvent>;
export type UserCommandHandler = CommandHandler<UserCommands>;