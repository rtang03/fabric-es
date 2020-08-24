import { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import { PO, PoEvents, PoCommands } from '.';

export * from './model';
export * from './events';
export * from './commands';
export * from './handler';
export * from './reducer';

export type PoRepo = Repository<PO, PoEvents>;
export type PoCommandHandler = CommandHandler<PoCommands>;
export type PoDS = DataSrc<PoRepo>;
