/**
 * @packageDocumentation
 * @hidden
 */
import { BaseEntity, BaseEvent, Reducer } from '../types';

export interface CounterEvent extends BaseEvent {
  type: string;
}

export class Counter extends BaseEntity {
  static entityName = 'counter';
  id?: string;
  value: number;
}

export class CounterPrivate extends BaseEntity {
  static entityName = 'privatedata_counter';
  id?: string;
  value: number;
}

export class CounterTrack extends BaseEntity {
  static parentName = 'counter';
  static entityName = 'tracking_counter';
  id?: string;
  value: number;
}

export const reducer: Reducer<Counter> = (history: CounterEvent[], initial: Counter = { value: 0 }): Counter =>
  history.reduce(reducerFcn, initial);

export const reducerPrivate: Reducer<CounterPrivate> = (history: CounterEvent[], initial: CounterPrivate = { value: 0 }): CounterPrivate =>
  history.reduce(reducerFcn, initial);

export const reducerTrack: Reducer<CounterTrack> = (history: CounterEvent[], initial: CounterTrack = { value: 0 }): CounterTrack =>
  history.reduce(reducerFcn, initial);

const reducerFcn = ({ value }, event: CounterEvent) => {
  switch (event.type) {
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
