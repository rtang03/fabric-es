import { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler } from '@fabric-es/gateway-lib';
import { Invoice, InvoiceEvents, InvoiceCommands } from '.';

export * from './model';
export * from './events';
export * from './commands';
export * from './handler';
export * from './reducer';

export type InvoiceRepo = Repository<Invoice, InvoiceEvents>;
export type InvoiceCommandHandler = CommandHandler<InvoiceCommands>;
