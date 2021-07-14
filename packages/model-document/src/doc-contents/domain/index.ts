import type { PrivateRepository } from '@fabric-es/fabric-cqrs';
import type { CommandHandler, ServiceContext } from '@fabric-es/gateway-lib';
import { DataSrc } from '@fabric-es/gateway-lib';
import type { DocContentsCommands } from './commands';
import type { DocContentsEvents } from './events';
import type { DocContents } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './handler';
export * from './reducer';

export type DocContentsRepo = PrivateRepository<DocContents, DocContentsEvents>;
export type DocContentsCommandHandler = CommandHandler<DocContentsCommands>;
export type DocContentsDataSource = DataSrc<DocContentsRepo>;

export type DocContentsContext = {
  dataSources: { docContents: DocContentsDataSource };
} & ServiceContext;
