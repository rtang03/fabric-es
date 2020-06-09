import { Repository } from '@fabric-es/fabric-cqrs';
import { CommandHandler, DataSrc } from '../../index';

export interface CounterCommands {
  Increment: {
    userId: string;
    payload: {
      counterId: string;
      timestamp: number;
    };
  };
  Decrement: {
    userId: string;
    payload: {
      counterId: string;
      timestamp: number;
    };
  };
}

export interface CounterEvent {
  type: string;
  payload: {
    id?: string;
    counterId?: string;
    desc?: string;
    tag?: string;
    ts?: number;
  };
}

export interface Counter {
  id?: string;
  value: number;
}

export type CounterRepo = Repository<Counter, CounterEvent>;

export type CounterCommandHandler = CommandHandler<CounterCommands>;

export type Context = {
  dataSources: {
    counter: DataSrc<Repository<Counter, CounterEvent>>;
  };
  user_id: string;
  username: string;
};
