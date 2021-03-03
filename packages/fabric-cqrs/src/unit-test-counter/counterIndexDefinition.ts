import type { CounterIndexDefintion } from './types';

/**
 * @about Redisearch index modeling information. This is map of [[FieldOption]].
 * It defines:
 * - altName: rename the key name after writing to Redis
 * - index: indexing rule
 * - transform: transformation function
 * @ignore
 */
export const counterIndexDefinition: CounterIndexDefintion = {
  // common fields
  id: { index: { type: 'TEXT', sortable: true } },
  value: { altName: 'val' },
  desc: { altName: 'de', index: { type: 'TEXT' } },
  tag: { index: { type: 'TAG' } },
  _ts: { altName: 'ts', index: { type: 'NUMERIC', sortable: true } },
  _created: { altName: 'created', index: { type: 'NUMERIC', sortable: true } },
  _creator: { altName: 'creator', index: { type: 'TEXT' } },
  // derived fields
  event: { index: { type: 'TAG' } },
  _organization: { altName: 'organ', index: { type: 'TEXT', sortable: true }},
};
