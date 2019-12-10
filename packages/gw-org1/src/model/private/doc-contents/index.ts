import { PrivatedataRepository } from '@espresso/fabric-cqrs';
import { CommandHandler, DataSrc } from '@espresso/model-common';
import { DocContentsCommands } from './commands';
import { DocContentsEvents } from './events';
import { DocContents } from './model';

export * from './model';
export * from './events';
export * from './commands';
export * from './reducer';
export * from './handler';
export type DocContentsRepo = PrivatedataRepository<DocContents, DocContentsEvents>;
export type DocContentsCommandHandler = CommandHandler<DocContentsCommands>;
export type DocContentsDS = DataSrc<DocContents, DocContentsEvents>;