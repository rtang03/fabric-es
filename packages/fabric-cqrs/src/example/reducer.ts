import { Reducer } from '../types';

export interface CounterEvent {
  type: string;
}

export interface Counter {
  id?: string;
  value: number;
}

export const reducer: Reducer<Counter> = (
  history: CounterEvent[],
  initial = { value: 0 }
): Counter => history.reduce(reducerFcn, initial);

const reducerFcn = ({ value }, { type }: CounterEvent) => {
  switch (type) {
    case 'ADD':
      value++;
      return { value };
    case 'MINUS':
      value--;
      return { value };
    default:
      return { value };
  }
};
