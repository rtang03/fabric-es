import { Reducer } from '@fabric-es/fabric-cqrs';
import { CounterEvents } from './events';
import { Counter, CounterEvent } from './types';

export const reducer: Reducer<Counter> = (history: CounterEvent[], initial = { value: 0 }): Counter =>
  history.reduce(reducerFcn, initial);

const reducerFcn = ({ value }, event: CounterEvents) => {
  switch (event.type) {
    case 'Increment':
      value++;
      return { value, counterId: event.payload.counterId };
    case 'Decrement':
      value--;
      return { value, counterId: event.payload.counterId };
  }
};
