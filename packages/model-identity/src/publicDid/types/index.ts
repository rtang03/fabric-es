import type { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import type { DidDocumentCommands } from './commands';
import type { DidDocument } from './didDocument';
import type { DidDocumentEvents } from './events';

export * from './didDocument';
export * from './did';
export * from './commands';
export * from './events';
export * from './indexDefinition';
export * from './didDocumentInRedis';
export * from './didDocumentContext';

export type DidDocumentRepo = Repository<DidDocument, DidDocumentEvents>;
export type DidDocumentCommandHandler = CommandHandler<DidDocumentCommands>;
export type DidDocumentDataSource = DataSrc<DidDocumentRepo>;
