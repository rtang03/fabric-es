import type { Counter, CounterEvents, Repository, CounterCommands } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '../../index';

export type CounterRepo = Repository<Counter, CounterEvents>;

export type CounterCommandHandler = CommandHandler<CounterCommands>;

export type Context = {
  dataSources: {
    'counter': DataSrc<Repository<Counter, CounterEvents>>;
  };
  user_id: string;
  username: string;
};
