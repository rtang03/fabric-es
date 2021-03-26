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
export class Counter implements BaseEntity {
  static entityName = 'counter';
  id: string;
  desc: string;
  tag: string;
  value: number;
  // _ts: number;
  // _created: number;
  // _creator: string;
  // _organization: string[];
}
