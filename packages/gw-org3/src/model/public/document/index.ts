import { Repository } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { CommandHandler } from '@fabric-es/gateway-lib';
import { DocumentCommands } from './commands';
import { DocumentEvents } from './events';
import { Document } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export { typeDefs as documentTypeDefs, resolvers as documentResolvers } from './typeDefs';
export * from './queries';
export type DocumentRepo = Repository<Document, DocumentEvents>;
export type DocumentCommandHandler = CommandHandler<DocumentCommands>;
export type DocumentDS = DataSrc<DocumentRepo>;
