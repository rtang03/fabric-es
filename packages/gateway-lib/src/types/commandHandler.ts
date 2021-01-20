import { Commit } from '@fabric-es/fabric-cqrs';

/**
 * @ignore
 */
export type CommandHandler<TCommand> = {
  [C in keyof TCommand]: (command: TCommand[C]) => Promise<Commit>;
};
