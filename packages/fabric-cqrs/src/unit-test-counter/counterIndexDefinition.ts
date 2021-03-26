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
  // derived fields
  event: { index: { type: 'TAG' } },
};
