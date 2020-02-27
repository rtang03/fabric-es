import { Repository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
import { CommandHandler } from '@espresso/model-common';
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
export type DocumentDS = DataSrc<Document, DocumentEvents>;
