import { Repository } from '@espresso/fabric-cqrs';
import { CommandHandler } from '..';
import { DocumentCommands } from './commands';
import { DocumentEvents } from './events';
import { Document } from './model';

export * from './model';
export * from './events';
export * from './reducer';
export * from './commands';
export * from './handler';
export type DocumentRepo = Repository<Document, DocumentEvents>;
export type DocumentCommandHandler = CommandHandler<DocumentCommands>;
