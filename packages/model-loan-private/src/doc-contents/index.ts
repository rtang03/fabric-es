import { PrivatedataRepository } from '@espresso/fabric-cqrs';
import { CommandHandler, DataSrc } from '@espresso/gw-node';
import { DocContentsCommands } from './domain/commands';
import { DocContentsEvents } from './domain/events';
import { DocContents } from './domain/model';

export * from './domain/model';
export * from './domain/events';
export * from './domain/commands';
export * from './domain/reducer';
export * from './domain/handler';
export { typeDefs as docContentsTypeDefs, resolvers as docContentsResolvers } from './typeDefs';
export { typeDefs as docContentsRemoteTypeDefs, resolvers as docContentsRemoteResolvers } from './remotes';
export * from './queries';
export type DocContentsRepo = PrivatedataRepository<DocContents, DocContentsEvents>;
export type DocContentsCommandHandler = CommandHandler<DocContentsCommands>;
export type DocContentsDS = DataSrc<DocContents, DocContentsEvents>;
