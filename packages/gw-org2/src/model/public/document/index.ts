import { Repository } from '@espresso/fabric-cqrs';
import { CommandHandler, DataSrc } from '@espresso/model-common';
import { DocumentCommands } from './commands';
import { DocumentEvents } from './events';
import { Document } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export { typeDefs as documentTypeDefs } from './schema';
export { resolvers as documentResolvers } from './resolvers';
export * from './queries';
export type DocumentRepo = Repository<Document, DocumentEvents>;
export type DocumentCommandHandler = CommandHandler<DocumentCommands>;
export type DocumentDS = DataSrc<Document, DocumentEvents>;