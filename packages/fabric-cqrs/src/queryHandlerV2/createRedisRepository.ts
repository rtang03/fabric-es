import flatten from 'lodash/flatten';
import { FTCreateParameters, FTSchemaField, Redisearch } from 'redis-modules-sdk';
import type { OutputSelector } from 'reselect';
import type { Commit } from '../types';
import type { FieldOption, RedisearchMapField, RedisRepository } from './types';

/**
 * @about create abstract layer for redis repository
 */
export const createRedisRepository: <TItem, TItemInRedis, TResult>(option: {
  client: Redisearch;
  kind?: 'entity' | 'commit';
  fields: RedisearchMapField<TItem>;
  entityName?: string;
  param?: FTCreateParameters;
  restore?: OutputSelector<TItemInRedis, TResult, any>;
}) => RedisRepository<TResult> = <TItem, TItemInRedis, TResult>({
  client,
  kind = 'entity' as any,
  fields,
  entityName,
  param,
  restore,
}) => {
  // every entity is indexed with Prefix "e:entityName:". commit is "c:"
  const indexName = { entity: `eidx`, commit: 'cidx' }[kind];

  const prefix = { entity: `e:`, commit: 'c:' }[kind];

  // compute key
  const getKey = {
    entity: ({ entityName, entityId }) => `${prefix}${entityName}:${entityId}`,
    commit: ({ entityName, entityId, commitId }: Commit) =>
      `${prefix}${entityName}:${entityId}:${commitId}`,
  }[kind];

  // convert to Redis Hash fields format, before hset / hmset
  const transformBeforeHset: <E>(fields: RedisearchMapField<E>, item: E) => (string | number)[] = <
    E
  >(
    input,
    item
  ) =>
    flatten<string | number>(
      Object.entries<FieldOption<E>>(input).map(([key, { altName, transform }]) => [
        // if alternate name exist, will replace orgingal key
        altName ?? key,
        // if transformation rule not exist, use original value
        transform?.(item) || item[key],
      ])
    );

  // add default FTCreateParameters
  const getParam: (param: FTCreateParameters) => FTCreateParameters = (param) =>
    Object.assign({}, { prefix: [{ count: 1, name: prefix }] }, param);

  // compute schema
  const getSchema: <F>(fields: F) => FTSchemaField[] = <F extends FieldOption>(input) =>
    Object.entries<F>(input)
      .map(
        ([key, { altName, index }]) =>
          // if index is required
          index && {
            ...index,
            // append the indexKey name
            name: altName ?? key,
          }
      )
      .filter((item) => !!item);

  return {
    createIndex: () => client.create(indexName, getSchema<TItem>(fields), getParam(param)),
    dropIndex: (deleteHash = true) => client.dropindex(indexName, deleteHash),
    hmset: (item) => client.redis.hmset(getKey(item), transformBeforeHset<TItem>(fields, item)),
    hgetall: (key) =>
      client.redis.hgetall(key).then((result) => (restore?.(result) || result) as TResult),
    getKey: (item) => getKey(item),
    getIndexName: () => indexName,
    convert: (item) => transformBeforeHset<TItem>(fields, item),
  };
};
