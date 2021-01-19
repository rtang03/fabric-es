import { Commit } from '@fabric-es/fabric-cqrs';

export type CommandHandler<TCommand> = {
  [C in keyof TCommand]: (command: TCommand[C]) => Promise<Commit>;
};
