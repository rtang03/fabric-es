import { FTCreateParameters, FTSchemaField, Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';
import type { Commit } from '../types';
import { postSelector as restoreCommit } from './model';
import { pipelineExec } from './pipelineExec';
import type { FieldOption, RedisearchDefinition, RedisRepository } from './types';
import { CommitInRedis, OutputCommit } from './types';
import util from 'util';
import { getLogger } from '../utils';

declare function MaybeCommit<T>(x: T): T extends Commit ? Commit : any;

/**
 * @about create abstract layer for redis repository
 */
export const createRedisRepository: <TItem, TItemInRedis, TResult>(option: {
  client: Redisearch;
  kind?: 'entity' | 'commit';
  fields: RedisearchDefinition<TItem>;
  entityName: string;
  param?: FTCreateParameters;
  preSelector?: Selector<[TItem, Commit[]?], TItemInRedis>;
  postSelector?: Selector<TItemInRedis, TResult>;
}) => RedisRepository<TResult> = <TItem, TItemInRedis, TResult>({
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
    entity: ({ entityId }) => `${prefix}${entityId}`,
    commit: ({ entityName, entityId, commitId }: Commit) =>
      `${prefix}${entityName}:${entityId}:${commitId}`,
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
    dropIndex: (deleteHash = true) => client.dropindex(indexName, deleteHash),
    hmset: (item, history) =>
      client.redis.hmset(getKey(item), preSelector?.([item, history]) || item),
    hgetall: (key) =>
      client.redis.hgetall(key).then((result) => (postSelector?.(result) || result) as TResult),
    getKey: (item: TItemInRedis) => getKey(item),
    getIndexName: () => indexName,
    getPattern: (pattern, args) =>
      ({
        COMMITS_BY_ENTITYNAME_ENTITYID: `c:${args[0]}:${args[1]}:*`,
        ENTITIES_BY_ENTITYNAME: `e:${args[0]}:*`,
        ENTITIES_BY_ENTITYNAME_ENTITYID: `e:${args[0]}:${args[1]}:*`,
      }[pattern]),
    getPreSelector: () => preSelector,
    getPostSelector: () => postSelector,
    queryCommitsByPattern: async (pattern) => {
      // restore commit history from Redis format, and detect any errors
      try {
        return await pipelineExec<CommitInRedis>(client, 'GET_ALL', pattern).then((data) => [
          data.map(([err, _]) => err).reduce((pre, cur) => pre || !!cur, false),
          data.map(([_, commit]) => commit).map((commitInRedis) => restoreCommit(commitInRedis)),
        ]);
      } catch (e) {
        logger.error(util.format('fail to retrieve existing commit, %j', e));
        return [e, null];
      }
    },
  };
};
