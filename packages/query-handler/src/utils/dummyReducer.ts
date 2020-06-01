import { BaseEvent, Reducer } from '@fabric-es/fabric-cqrs';

export interface Increment extends BaseEvent {
  readonly type: 'Increment';
  payload: {
    id: string;
    ts: number;
  };
}

export interface Decrement extends BaseEvent {
  readonly type: 'Decrement';
  payload: {
    id: string;
    ts: number;
  };
}

export type CounterEvents = Increment | Decrement;

export interface CounterEvent {
  type: string;
  payload: any;
}

export interface Counter {
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
