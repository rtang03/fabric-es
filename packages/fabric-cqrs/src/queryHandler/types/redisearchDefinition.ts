import type { FTSchemaField } from 'redis-modules-sdk';

/**
 * @about define property of each Redis Hash field. The naming convention of Redis Hash Fields
 * is lowercase with removed special character. The original field name may be invalid, and
 * "altName" can fix it.
 */
export type FieldOption = {
  /* rename the key of hash field. Then, it alter field of TItem, after writing to Redis*/
  altName?: string;
  /* secondary index schema. By default the indexed field name will be the same field name */
  index?: Omit<FTSchemaField, 'name'>;
};

/**
 * @about Map of FieldOptions for each Hash field of Redisearch
 */
export type RedisearchDefinition<T> = {
  [K in keyof T]: FieldOption;
};
