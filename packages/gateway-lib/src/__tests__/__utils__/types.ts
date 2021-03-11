import type { Counter, CounterEvents, Repository, CounterCommands, OutputCounter } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '../../index';

export type CounterRepo = Repository<Counter, OutputCounter, CounterEvents>;

export type CounterCommandHandler = CommandHandler<CounterCommands>;

export type Context = {
  dataSources: {
    'counter': DataSrc<Repository<Counter, OutputCounter, CounterEvents>>;
  };
  user_id: string;
  username: string;
};
