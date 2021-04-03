import type { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import type { IdentifierCommands } from './commands';
import type { IdentifierEvents } from './events';
import type { Identifier } from './identifier';

export * from './identifier';
export * from './events';
export * from './commands';
export * from './context';
export * from './indexDefinition';

export type IdentifierRepo = Repository<Identifier, Identifier, IdentifierEvents>;
export type IdentifierCommandHandler = CommandHandler<IdentifierCommands>;
export type IdentifierDataSource = DataSrc<IdentifierRepo>;
