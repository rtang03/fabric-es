import { Repository } from '@espresso/fabric-cqrs';
import { CommandHandler, DataSrc } from '..';
import { DocumentCommands } from './commands';
import { DocumentEvents } from './events';
import { Document } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export { typeDefs as documentTypeDefs, resolvers as documentResolvers } from './datagraph';
export type DocumentRepo = Repository<Document, DocumentEvents>;
export type DocumentCommandHandler = CommandHandler<DocumentCommands>;
export type DocumentDS = DataSrc<Document, DocumentEvents>;