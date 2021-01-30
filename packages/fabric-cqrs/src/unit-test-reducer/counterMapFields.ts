import type { CounterMapFields } from './types';

/**
 * @about Redisearch index modeling information
 * @ignore
 */
export const counterMapFields: CounterMapFields = {
  id: { index: { type: 'TEXT', sortable: true } },
  value: {},
  desc: { index: { type: 'TEXT' } },
  tag: { index: { type: 'TAG' } },
  _ts: { altName: 'ts', index: { type: 'NUMERIC', sortable: true } },
  _created: { altName: 'created', index: { type: 'NUMERIC', sortable: true } },
  _creator: { altName: 'creator', index: { type: 'TEXT' } },
};
