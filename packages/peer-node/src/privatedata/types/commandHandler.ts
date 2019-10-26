import { EtcPoCommands } from './etc-po';

type CommandHandler<T> = { [C in keyof T]: (command: T[C]) => Promise<any> };

export type EtcPoCommandHandler = CommandHandler<EtcPoCommands>;
