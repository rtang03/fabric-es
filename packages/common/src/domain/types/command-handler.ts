import { DocumentCommands } from './document';
import { TradeCommands } from './trade';

type CommandHandler<T> = { [C in keyof T]: (command: T[C]) => Promise<any> };

/**
 * Command Handlers of Local Document
 */
export type DocCommandHandler = CommandHandler<DocumentCommands>;

/**
 * Command Handlers of Trade
 */
export type TradeCommandHandler = CommandHandler<TradeCommands>;

/**
 * Command Handlers of Local Document
 */
// export type LocalDocCommandHandler = CommandHandler<LocalDocCommands>;
