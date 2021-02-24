import type { BaseEntity } from '../../types';

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
export interface Counter extends BaseEntity {
  id: string;
  desc: string;
  tag: string;
  value: number;
  _ts: number;
  _created: number;
  _creator: string;
}
