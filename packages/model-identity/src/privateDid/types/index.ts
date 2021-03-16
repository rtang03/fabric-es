import type { PrivateRepository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import type { PrivateDidDocumentCommands } from './commands';
import type { PrivateDidDocEvents } from './events';
import { PrivateDidDocument } from './privateDidDocument';

export * from './privateDidDocument';
export * from './events';
export * from './privateDidDocumentContext';

export type PrivateDidDocumentRepo = PrivateRepository<PrivateDidDocument, PrivateDidDocEvents>;
export type PrivateDidDocCommandHandler = CommandHandler<PrivateDidDocumentCommands>;
export type PrivateDidDocumentDataSource = DataSrc<PrivateDidDocumentRepo>;
