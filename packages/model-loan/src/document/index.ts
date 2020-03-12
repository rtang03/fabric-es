import { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import { DocumentCommands } from './domain/commands';
import { DocumentEvents } from './domain/events';
import { Document } from './domain/model';

export * from './domain/model';
export * from './domain/events';
export * from './domain/commands';
export * from './domain/reducer';
export * from './domain/handler';
export { typeDefs as documentTypeDefs, resolvers as documentResolvers } from './typeDefs';
export * from './queries';
export type DocumentRepo = Repository<Document, DocumentEvents>;
export type DocumentCommandHandler = CommandHandler<DocumentCommands>;
export type DocumentDS = DataSrc<Document, DocumentEvents>;
