import { PrivatedataRepository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
import { CommandHandler } from '@espresso/model-common';
import { DocContentsCommands } from './commands';
import { DocContentsEvents } from './events';
import { DocContents } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export {
  typeDefs as docContentsTypeDefs,
  resolvers as docContentsResolvers
} from './typeDefs';
export {
  typeDefs as docContentsRemoteTypeDefs,
  resolvers as docContentsRemoteResolvers
} from './remotes';
export * from './queries';
export type DocContentsRepo = PrivatedataRepository<DocContents, DocContentsEvents>;
export type DocContentsCommandHandler = CommandHandler<DocContentsCommands>;
export type DocContentsDS = DataSrc<DocContents, DocContentsEvents>;