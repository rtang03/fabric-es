import type {
  Counter,
  CounterEvents,
  Repository,
  CounterCommands,
  OutputCounter,
} from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '../../index';

export type CounterRepo = Repository<Counter, OutputCounter, CounterEvents>;

export type CounterCommandHandler = CommandHandler<CounterCommands>;

// Apollo Context, when using old Auth-server
export type Context = {
  dataSources: {
    counter: DataSrc<Repository<Counter, OutputCounter, CounterEvents>>;
  };
  user_id: string;
  username: string;
};

// Apollo Context, when using Auth0
export type ContextWithAuth0 = {
  dataSources: {
    counter: DataSrc<Repository<Counter, OutputCounter, CounterEvents>>;
  };
  enrollment_id: string;
  user_id?: string;
  auth0_email?: string;
  auth0_name?: string;
  auth0_nickname?: string;
};
