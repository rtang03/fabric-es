import { BaseEvent } from '../../types';

export interface Increment extends BaseEvent {
  readonly type: 'Increment';
  payload: {
    id: string;
    desc: string;
    tag: string;
    ts: number;
  };
}

export interface Decrement extends BaseEvent {
  readonly type: 'Decrement';
  payload: {
    id: string;
    desc: string;
    tag: string;
    ts: number;
  };
}

export type CounterEvents = Increment | Decrement;
