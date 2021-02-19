import type { Repository } from '@fabric-es/fabric-cqrs';
import type { CommandHandler } from '@fabric-es/gateway-lib';
import { DataSrc } from '@fabric-es/gateway-lib';
import type { DocumentCommands } from './commands';
import type { Document } from './document';
import type { DocumentEvents } from './events';

export * from './commands';
export * from './events';
export * from './document';
export * from './documentContext';
export * from './documentInRedis';
export * from './outputDocument';
export * from './indexDefinition';

export type DocumentCommandHandler = CommandHandler<DocumentCommands>;
export type DocumentRepo = Repository<Document, DocumentEvents>;
export type DocumentDataSource = DataSrc<DocumentRepo>;
