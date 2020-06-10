import type { BaseEvent, Reducer } from '../../../types';

interface Add extends BaseEvent {
  readonly type: 'Add';
  payload: {
    timestamp: number;
  };
}

interface Minus extends BaseEvent {
  readonly type: 'Minus';
  payload: {
    timestamp: number;
  };
}

type SimpleCounterEvents = Add | Minus;

interface SimpleCounterEvent {
  type: string;
  payload: any;
}

export interface SimpleCounter {
  value: number;
}

export const simpleCounterReducer: Reducer<SimpleCounter> = (
  history: SimpleCounterEvent[],
  initial = { value: 0 }
): SimpleCounter => history.reduce(reducerFcn, initial);

const reducerFcn = ({ value }, event: SimpleCounterEvents) => {
  switch (event.type) {
    case 'Add':
      value++;
      return { value };
    case 'Minus':
      value--;
      return { value };
    default:
      return { value };
  }
};
