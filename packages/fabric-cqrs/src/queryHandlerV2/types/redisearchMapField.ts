import { FTSchemaField } from 'redis-modules-sdk';

/**
 * @about define property of each Redis Hash field. The naming convention of Redis Hash Fields
 * is lowercase with removed special character. The original field name may be invalid, and
 * "altName" can fix it. Also, the original field in ITEM may "transform" to proper field content
 * and format, e.g. stringified; so that it can be properly written to Redis
 */
export type FieldOption<TItem = any> = {
  /* rename the key of hash field. Then, it alter field of TItem, after writing to Redis*/
  altName?: string;
  /* secondary index schema. By default the indexed field name will be the same field name */
  index?: Omit<FTSchemaField, 'name'>;
  /* field transformation before writing to Redis */
  transform?: (arg: TItem) => string | number;
  /* field transformation after hget / hmget / hgetall */
};

/**
 * @about Map of FieldOptions for each Hash field of Redisearch
 */
export type RedisearchMapField<T> = {
  [K in keyof T]: FieldOption<T>;
};
