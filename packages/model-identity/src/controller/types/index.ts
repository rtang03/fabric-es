import type { PrivateRepository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '@fabric-es/gateway-lib';
import type { ControllerCommands } from './commands';
import type { Controller } from './controller';
import type { ControllerEvents } from './events';

export * from './controller';
export * from './events';

export type ControllerRepo = PrivateRepository<Controller, ControllerEvents>;
export type ControllerCommandHandler = CommandHandler<ControllerCommands>;
export type ControllerDataSource = DataSrc<ControllerRepo>;
export type ControllerContext = {
  dataSources: { controller: ControllerDataSource };
  enrollment_id: string;
  user_id: string;
};
