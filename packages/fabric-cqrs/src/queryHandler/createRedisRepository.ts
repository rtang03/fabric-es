import util from 'util';
import Debug from 'debug';
import startsWith from 'lodash/startsWith';
import { FTCreateParameters, FTSchemaField, Redisearch } from 'redis-modules-sdk';
import { createSelector, Selector } from 'reselect';
import type { Commit, EntityType } from '../types';
import { getLogger } from '../utils';
import { postSelector as restoreCommit } from './model';
import { pipelineExec } from './pipelineExec';
import type { FieldOption, OutputCommit, RedisearchDefinition, RedisRepository } from './types';
import type { CommitInRedis } from './types';
import { baseIndexDefinition } from './types/baseIndexDefinition';
import { basePreSelector, basePostSelector } from './types/baseSelectors';

/**
 * @about create abstract layer for redis repository
 * @typeParams TInput item before writing to Redis / input to pre-selector
 * @typeParams TIItemInRedis item in redis
 * @typeParams TOutput item after processing by post-selector
 */
export const createRedisRepository: <TInput, TItemInRedis, TOutput>(
  entity: EntityType<TInput> | string,
  option: {
    client: Redisearch;
    kind?: 'entity' | 'commit';
    fields: RedisearchDefinition<TInput>;
    param?: FTCreateParameters;
    preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    postSelector?: Selector<TItemInRedis, TOutput>;
  }
) => RedisRepository<TOutput> = <TItem, TItemInRedis, TResult>(
  entity,
  { client, kind = 'entity' as any, fields, param, preSelector, postSelector }
) => {
  const debug = Debug('queryHandler:createRedisRepository');

  const entityName = typeof entity === 'string' ? entity : entity.entityName;
  const logger = getLogger({ name: '[query-handler] createRedisRepository.js', target: 'console' });

  // every entity is indexed with Prefix "e:entityName:". commit is "c:"
  const indexName = { entity: `eidx:${entityName}`, commit: 'cidx' }[kind];

  const prefix = { entity: `e:${entityName}:`, commit: 'c:' }[kind];

  const combinedPreSelector = preSelector
    ? {
        entity: createSelector(preSelector as Selector<any, any>, basePreSelector, (pre, bse) => ({
          ...pre,
          ...bse,
        })),
        commit: preSelector,
      }[kind]
    : undefined;

  const combinedPostSelector = postSelector
    ? {
        entity: createSelector(
          postSelector as Selector<any, any>,
          basePostSelector,
          (pre, bse) => ({
            ...pre,
            ...bse,
          })
        ),
        commit: postSelector,
      }[kind]
    : undefined;

  const combinedFields = {
    entity: {
      ...fields,
      ...baseIndexDefinition,
    },
    commit: fields,
  }[kind];

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
    createIndex: () => client.create(indexName, getSchema<TItem>(combinedFields), getParam(param)),
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
      debug('hmset:item, %O', item);

      const key = getKey(item);

      debug('hmset:key, %s', key);

      if (!key) throw new Error('invalid key');

      return client.redis.hmset(key, combinedPreSelector?.([item, history]) || item);
    },
    hgetall: (key) =>
      client.redis
        .hgetall(key)
        .then((result) => (combinedPostSelector?.(result) || result) as TResult),
    getKey: (item: TItemInRedis) => getKey(item),
    getIndexName: () => indexName,
    getPattern: (pattern, args) =>
      // args[0] is entityName
      // args[1] is entityId
      ({
        COMMITS_BY_ENTITYNAME: `c:${args[0]}:*`,
        COMMITS_BY_ENTITYNAME_ENTITYID: `c:${args[0]}:${args[1]}:*`,
        ENTITIES_BY_ENTITYNAME: `e:${args[0]}:*`,
        ENTITIES_BY_ENTITYNAME_ENTITYID: `e:${args[0]}:${args[1]}:*`,
      }[pattern]),
    getPreSelector: (): Selector<TItem, TItemInRedis> => combinedPreSelector,
    getPostSelector: (): Selector<TItemInRedis, TResult> => combinedPostSelector,
    queryCommitsByPattern: async (pattern) => {
      try {
        debug('queryCommitsByPattern:pattern, %s', pattern);

        return await pipelineExec<CommitInRedis>(client, 'HGETALL', pattern).then((data) => [
          data.map(([err, _]) => {
            debug('queryCommitsByPattern:error, %O', err);

            return err;
          }),
          data
            .map<OutputCommit>(([_, commit]) => {
              debug('queryCommitsByPattern:commit, %O', commit);

              return restoreCommit(commit);
            })
            .sort((a, b) => a.ts - b.ts),
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
          : kind === 'commit'
          ? { ...param, sortBy: { sort: 'ASC', field: 'ts' } }
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

        // TODO NOTE 20210726 !!!!!! disable for now...
        // TODO NOTE 20210722 !!!! removing the above code because pipelineExec is wrong, as it always sort the result in ascending order.
        // However fixing pipelineExec will break a few unit tests (e.g. 'should #2 queryByEntityId: DESC order' in query.store.unit-test.ts). The initial assessment is those unit tests are wrong as well!!!
        // e.g. in 'should #2 queryByEntityId: DESC order', the test was expecting the result to be in descending order.  HOWEVER the query result was reversed (???!!!) by Array.reverse() INSIDE the test,
        // so frankly it is the javascript func Array.reverse() being tested here, instead of the query code. This Array.reverse() thing happened quite a few times in this test alone.
        // In the interest of time, the pipelineExec func is skipped and replace with the code below:
        // const pipeline = client.redis.pipeline();
        // keys.forEach(key => pipeline.hgetall(key));
        // return await pipeline.exec().then(data => [
        //   data.map(([err, _]) => err),
        //   count,
        //   data.map(
        //     ([_, item]) => ({ commit: restoreCommit, entity: restoreFn }[kind]?.(item) || item)
        //   ),
        // ]);
      } catch (e) {
        logger.error(util.format('fail to search, %j', e));
        return [[e], null, null];
      }
    },
  };
};
