import { BaseEntity } from '../types';

export interface CounterCommands {
  Increment: {
    userId: string;
    payload: {
      id: string;
      desc: string;
      tag: string;
    };
  };
  Decrement: {
    userId: string;
    payload: {
      id: string;
      desc: string;
      tag: string;
    };
  };
}

export interface CounterEvent {
  type: string;
  payload: any;
}

export interface Counter extends BaseEntity {
  id: string;
  desc: string;
  tag: string;
  value: number;
}
