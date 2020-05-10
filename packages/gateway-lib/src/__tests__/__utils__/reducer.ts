import { Reducer } from '@fabric-es/fabric-cqrs';
import { Counter, CounterEvent } from './types';
import { CounterEvents } from './events';

export const reducer: Reducer<Counter> = (history: CounterEvent[], initial = { value: 0 }): Counter =>
  history.reduce(reducerFcn, initial);

const reducerFcn = ({ value }, event: CounterEvents) => {
  switch (event.type) {
    case 'Increment':
      value++;
      return { value };
    case 'Decrement':
      value--;
      return { value };
    default:
      return { value };
  }
};
