import type { BaseMetaEntity } from '../types';

/**
 * @ignore
 */
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

/**
 * @ignore
 */
export interface CounterEvent {
  type: string;
  payload: any;
}

/**
 * @ignore
 */
export interface Counter extends BaseMetaEntity {
  id: string;
  desc: string;
  tag: string;
  value: number;
}
