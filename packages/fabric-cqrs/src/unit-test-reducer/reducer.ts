import { Reducer } from '../types';
import { CounterEvents } from './events';
import { Counter, CounterEvent } from './types';

export const reducer: Reducer<Counter> = (
  history: CounterEvent[],
  initial = { id: null, desc: null, tag: null, value: 0, ts: 0 }
): Counter => history.reduce(reducerFcn, initial);

const reducerFcn = (state, { type, payload: { id, desc, tag, ts } }: CounterEvents) => {
  switch (type) {
    case 'Increment':
      state.value++;
      return { value: state.value, id, desc, tag, ts };
    case 'Decrement':
      state.value--;
      return { value: state.value, id, desc, tag, ts };
  }
};
