import type { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import type { DidDocument, DidDocumentCommands } from '../../types';
import type { DidDocumentEvents } from './events';

export * from './events';
export * from './indexDefinition';
export * from './didDocumentInRedis';
export * from './didDocumentContext';

export type DidDocumentRepo = Repository<DidDocument, DidDocument, DidDocumentEvents>;
export type DidDocumentCommandHandler = CommandHandler<DidDocumentCommands>;
export type DidDocumentDataSource = DataSrc<DidDocumentRepo>;
