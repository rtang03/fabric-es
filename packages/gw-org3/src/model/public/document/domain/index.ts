import type { Repository } from '@fabric-es/fabric-cqrs';
import type { CommandHandler } from '@fabric-es/gateway-lib';
import { DataSrc } from '@fabric-es/gateway-lib';
import type { DocumentCommands } from './commands';
import type { DocumentEvents } from './events';
import type { Document } from './model';
import { DocumentOutput } from './output';

export * from './commands';
export * from './events';
export * from './model';
export * from './redis';
export * from './output';
export * from './indices';
export * from './handler';
export * from './reducer';

export type DocumentCommandHandler = CommandHandler<DocumentCommands>;
export type DocumentRepo = Repository<Document, DocumentOutput, DocumentEvents>;
export type DocumentDataSource = DataSrc<DocumentRepo>;

export type DocumentContext = {
  dataSources: { document: DocumentDataSource };
  username: string;
};
