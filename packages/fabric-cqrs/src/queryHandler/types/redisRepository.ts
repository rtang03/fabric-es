import type { FTSearchParameters } from 'redis-modules-sdk';
import type { Selector } from 'reselect';
import type { Commit } from '../../types';
import type { OutputCommit } from './outputCommit';

type Pattern =
  | 'COMMITS_BY_ENTITYNAME'
  | 'COMMITS_BY_ENTITYNAME_ENTITYID'
  | 'ENTITIES_BY_ENTITYNAME'
  | 'ENTITIES_BY_ENTITYNAME_ENTITYID';

/**
 * @about abstraction of Redis operations
 */
export type RedisRepository<TItem = any, TItemInRedis = any, TResult = any> = {
  /**
   * create index, either eidx:ENTITYNAME or cidx
   * @see https://oss.redislabs.com/redisearch/Commands/#ftcreate
   */
  createIndex: () => Promise<'OK'>;

  /**
   * @example 2 commits are successfully delete, pipelineExec returns [ [ null, 1 ], [ null, 1 ] ]
   * .then return tuple [error, number-of-successful-delete]
   */
  deleteItemsByPattern: (pattern: string) => Promise<[any, number]>;

  /** drop redisearch index, either eidx:ENTITYNAME or cidx **/
  dropIndex: (deleteHash?: boolean) => Promise<'OK'>;

  /**
   * hmset write to Redis.
   * @param item item to save
   * @param history is used to compute derived fields, if preSelector exists
   * @see https://redis.io/commands/hmset
   * @see https://oss.redislabs.com/redisearch/Commands/#hsethsetnxhdelhincrbyhdecrby
   */
  hmset: (item: any, history?: Commit[]) => Promise<'OK'>;
  // see https://redis.io/commands/hgetall

  /**
   * return hash
   * @see https://redis.io/commands/hgetall
   * @param key
   */
  hgetall: (key: string) => Promise<TResult>;

  /** return key of item. The item is either an entity, or commit **/
  getKey: (item: any) => string;

  getIndexName: () => string;

  /** return the pattern expression **/
  getPattern: (pattern: Pattern, args: string[]) => string;

  getPreSelector: () => Selector<TItem, TItemInRedis>;

  getPostSelector: () => Selector<TItemInRedis, TResult>;

  /**
   * @about restore commit history from Redis format, and detect any errors
   * pipelinExec .then will return tuple [error, commitInRedis[])
   */
  queryCommitsByPattern: (pattern: string) => Promise<[any, OutputCommit[]] | null>;

  /** perform search **/
  search: (option: {
    countTotalOnly?: boolean;
    kind: 'commit' | 'entity';
    index: string;
    query: string;
    param?: FTSearchParameters;
    restoreFn?: any;
  }) => Promise<[Error[], number, TResult[]]>;
};
