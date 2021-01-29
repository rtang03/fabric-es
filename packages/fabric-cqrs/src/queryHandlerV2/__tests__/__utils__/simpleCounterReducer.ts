/**
 * @packageDocumentation
 * @hidden
 */
import type { BaseEvent, Reducer } from '../../../types';

interface Add extends BaseEvent {
  readonly type: 'Add';
  payload: {
    id: string;
    desc: string;
    tag: string;
    ts: number;
  };
}

interface Minus extends BaseEvent {
  readonly type: 'Minus';
  payload: {
    id: string;
    desc: string;
    tag: string;
    ts: number;
  };
}

type SimpleCounterEvents = Add | Minus;

interface SimpleCounterEvent {
  type: string;
  payload: any;
}

export interface SimpleCounter {
  id?: string;
  lastAction?: string;
  value: number;
}

export const simpleCounterReducer: Reducer<SimpleCounter> = (
  history: SimpleCounterEvent[],
  initial = { value: 0 }
): SimpleCounter => history.reduce(reducerFcn, initial);

const reducerFcn = (state, { type, payload: { id, desc, tag, ts } }: SimpleCounterEvents) => {
  switch (type) {
    case 'Add':
      state.value++;
      return {
        lastAction: type,
        value: state.value,
        id,
        desc,
        tag,
        ts,
      };

    case 'Minus':
      state.value--;
      return {
        lastAction: type,
        value: state.value,
        id,
        desc,
        tag,
        ts,
      };

    default:
      return state;
  }
};
