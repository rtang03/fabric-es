import { BaseEvent, Reducer } from '@fabric-es/fabric-cqrs';

interface Increment extends BaseEvent {
  readonly type: 'Increment';
  payload: {
    id: string;
    ts: number;
  };
}

interface Decrement extends BaseEvent {
  readonly type: 'Decrement';
  payload: {
    id: string;
    ts: number;
  };
}

type CounterEvents = Increment | Decrement;

interface CounterEvent {
  type: string;
  payload: any;
}

interface Counter {
  id: string;
  value: number;
  ts: number;
}

export const dummyReducer: Reducer<Counter> = (
  history: CounterEvent[],
  initial = { id: null, value: 0, ts: 0 }
): Counter => history.reduce(reducerFcn, initial);

const reducerFcn = (state, { type, payload: { id, ts } }: CounterEvents) => {
  switch (type) {
    case 'Increment':
      state.value++;
      return { value: state.value, id, ts };
    case 'Decrement':
      state.value--;
      return { value: state.value, id, ts };
  }
};
