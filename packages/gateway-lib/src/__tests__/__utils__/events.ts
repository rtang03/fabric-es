import { BaseEvent } from '@fabric-es/fabric-cqrs';

export interface Increment extends BaseEvent {
  readonly type: 'Increment';
  payload: {
    timestamp: number;
  };
}

export interface Decrement extends BaseEvent {
  readonly type: 'Decrement';
  payload: {
    timestamp: number;
  };
}

export type CounterEvents = Increment | Decrement;
