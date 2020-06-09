import { BaseEvent } from '@fabric-es/fabric-cqrs';

export interface Increment extends BaseEvent {
  readonly type: 'Increment';
  payload: {
    counterId: string;
    timestamp?: number;
  };
}

export interface Decrement extends BaseEvent {
  readonly type: 'Decrement';
  payload: {
    counterId: string;
    timestamp?: number;
  };
}

export type CounterEvents = Increment | Decrement;
