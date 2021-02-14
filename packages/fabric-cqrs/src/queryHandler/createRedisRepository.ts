import util from 'util';
import startsWith from 'lodash/startsWith';
import { FTCreateParameters, FTSchemaField, Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';
import type { Commit } from '../types';
import { getLogger } from '../utils';
import { postSelector as restoreCommit } from './model';
import { pipelineExec } from './pipelineExec';
import type { FieldOption, RedisearchDefinition, RedisRepository } from './types';
import type { CommitInRedis } from './types';

/**
 * @about create abstract layer for redis repository
 */
export const createRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
  client: Redisearch;
  kind?: 'entity' | 'commit';
  fields: RedisearchDefinition<TInput>;
  entityName: string;
  param?: FTCreateParameters;
  preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
  postSelector?: Selector<TItemInRedis, TOutput>;
}) => RedisRepository<TOutput> = <TItem, TItemInRedis, TResult>({
  client,
  kind = 'entity' as any,
  fields,
  entityName,
  param,
  preSelector,
  postSelector,
}) => {
  const logger = getLogger({ name: '[query-handler] createRedisRepository.js', target: 'console' });

  // every entity is indexed with Prefix "e:entityName:". commit is "c:"
  const indexName = { entity: `eidx:${entityName}`, commit: 'cidx' }[kind];

  const prefix = { entity: `e:${entityName}:`, commit: 'c:' }[kind];

  // compute key
  const getKey = {
    entity: ({ id }) => (!id ? null : `${prefix}${id}`),
    commit: ({ entityName, entityId, commitId }: Commit) =>
      !entityName || !entityId || !commitId
        ? null
        : `${prefix}${entityName}:${entityId}:${commitId}`,
  }[kind];

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
    deleteItemsByPattern: async (pattern) => {
      try {
        return await pipelineExec<number>(client, 'DELETE', pattern).then((data) => [
          data.map(([err, _]) => err),
          data.map(([_, count]) => count).reduce((pre, cur) => pre + cur, 0),
        ]);
      } catch (e) {
        logger.error(util.format('fail to deleteCommitsByPattern, %j', e));
        return [e, null];
      }
    },
    dropIndex: (deleteHash = true) => client.dropindex(indexName, deleteHash),
    hmset: (item, history) => {
      const key = getKey(item);

      if (!key) throw new Error('invalid key');

      return client.redis.hmset(key, preSelector?.([item, history]) || item);
    },
    hgetall: (key) =>
      client.redis.hgetall(key).then((result) => (postSelector?.(result) || result) as TResult),
    getKey: (item: TItemInRedis) => getKey(item),
    getIndexName: () => indexName,
    getPattern: (pattern, args) =>
      ({
        COMMITS_BY_ENTITYNAME: `c:${args[0]}:*`,
        COMMITS_BY_ENTITYNAME_ENTITYID: `c:${args[0]}:${args[1]}:*`,
        ENTITIES_BY_ENTITYNAME: `e:${args[0]}:*`,
        ENTITIES_BY_ENTITYNAME_ENTITYID: `e:${args[0]}:${args[1]}:*`,
      }[pattern]),
    getPreSelector: <TInput, TOutput>(): Selector<TInput, TOutput> => preSelector,
    getPostSelector: <TInput, TOutput>(): Selector<TInput, TOutput> => postSelector,
    queryCommitsByPattern: async (pattern) => {
      try {
        return await pipelineExec<CommitInRedis>(client, 'HGETALL', pattern).then((data) => [
          data.map(([err, _]) => err),
          data.map(([_, commit]) => restoreCommit(commit)),
        ]);
      } catch (e) {
        logger.error(util.format('fail to queryCommitsByPattern, %j', e));
        return [e, null];
      }
    },
    search: async ({ countTotalOnly, kind, index, query, param, restoreFn }) => {
      try {
        const customParm = countTotalOnly
          ? { ...param, ...{ limit: { first: 0, num: 0 } } }
          : param;
        // step 1: use FT.SEARCH to find corresponding keys
        const data: any[] = await client.search(index, query, customParm);

        // Notice that if there is paginated result, the number of total count of search result, data[0] will the total count.
        // But the subsequment array element will only return ONE page
        // e.g.
        // [
        //   2, <== Number of total count of search result
        //   'c:test_proj:qh_proj_test_001:20200528133520841',
        //   [
        //     'entityName',
        //     'test_proj',
        //     'id',
        //    ....
        // ]
        const prefix = { commit: 'c:', entity: 'e:' }[kind];

        // keys will be ['c:test_proj:qh_proj_test_001:20200528133520841', /* ... */ ]
        const keys = data.slice(1).filter((item) => startsWith(item, prefix));

        const count = countTotalOnly ? data[0] : keys?.length;

        if (countTotalOnly) return [[], count, null];

        // step 2: retrieve actual content, and restore to proper shape
        return await pipelineExec<TResult>(client, 'HGETALL', null, keys).then((data) => [
          data.map(([err, _]) => err),
          count,
          data.map(
            ([_, item]) => ({ commit: restoreCommit, entity: restoreFn }[kind]?.(item) || item)
          ),
        ]);
      } catch (e) {
        logger.error(util.format('fail to search, %j', e));
        return [[e], null, null];
      }
    },
  };
};
