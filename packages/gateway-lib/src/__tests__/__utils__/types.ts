import type { Counter, CounterEvent, Repository, CounterCommands } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '../../index';

export type CounterRepo = Repository<Counter, CounterEvent>;

export type CounterCommandHandler = CommandHandler<CounterCommands>;

export type Context = {
  dataSources: {
    'gw-repo-counter': DataSrc<Repository<Counter, CounterEvent>>;
  };
  user_id: string;
  username: string;
};
