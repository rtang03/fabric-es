import { BaseEvent } from '../types';

export interface Increment extends BaseEvent {
  readonly type: 'Increment';
  payload: {
    id: string;
    desc: string;
    tag: string;
    _ts?: number;
    _created?: number;
    _creator?: string;
  };
}

export interface Decrement extends BaseEvent {
  readonly type: 'Decrement';
  payload: {
    id: string;
    desc: string;
    tag: string;
    _ts?: number;
    _created?: number;
    _creator?: string;
  };
}

export type CounterEvents = Increment | Decrement;
