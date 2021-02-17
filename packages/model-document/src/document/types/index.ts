import type { Repository } from '@fabric-es/fabric-cqrs';
import type { CommandHandler } from '@fabric-es/gateway-lib';
import { DataSrc } from '@fabric-es/gateway-lib';
import type { DocumentCommands } from './commands';
import type { Document } from './document';
import type { DocumentEvents } from './events';

export * from './documentContext';
export * from './commands';
export * from './events';
export * from './document';
export * from './indexDefinition';
export * from './documentInRedis';
export * from './outputDocument';

export type DocumentRepo = Repository<Document, DocumentEvents>;
export type DocumentCommandHandler = CommandHandler<DocumentCommands>;
export type DocumentDataSource = DataSrc<DocumentRepo>;
