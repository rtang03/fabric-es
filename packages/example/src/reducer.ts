import { Reducer } from '@espresso/fabric-cqrs';

export interface CounterEvent {
  type: string;
}

export interface Counter {
  id: string;
  value: number;
}

export const reducer: Reducer<Counter> = (
  history: CounterEvent[],
  initial: Counter
): Counter =>
  history.reduce(
    ({ id, value }, { type }) =>
      ({
        ['ADD']: () => {
          value++;
          return { id, value };
        },
        ['MINUS']: () => {
          value--;
          return { id, value };
        }
      }[type]()),
    initial
  );
