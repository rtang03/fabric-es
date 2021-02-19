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
export type RedisRepository<TResult = any> = {
  // https://oss.redislabs.com/redisearch/Commands/#ftcreate
  createIndex: () => Promise<'OK'>;
  /**
   * @example 2 commits are successfully delete, pipelineExec returns [ [ null, 1 ], [ null, 1 ] ]
   * .then return tuple [error, number-of-successful-delete]
   */
  deleteItemsByPattern: (pattern: string) => Promise<[any, number]>;
  dropIndex: (deleteHash?: boolean) => Promise<'OK'>;
  // see https://redis.io/commands/hmset
  // see https://oss.redislabs.com/redisearch/Commands/#hsethsetnxhdelhincrbyhdecrby
  hmset: (item: any, history?: Commit[]) => Promise<'OK'>;
  // see https://redis.io/commands/hgetall
  hgetall: (key: string) => Promise<TResult>;
  getKey: (item: any) => string;
  getIndexName: () => string;
  getPattern: (pattern: Pattern, args: string[]) => string;
  getPreSelector: <TInput, TOutput>() => Selector<TInput, TOutput>;
  getPostSelector: <TInput, TOutput>() => Selector<TInput, TOutput>;
  /**
   * @about restore commit history from Redis format, and detect any errors
   * pipelinExec .then will return tuple [error, commitInRedis[])
   */
  queryCommitsByPattern: (pattern: string) => Promise<[any, OutputCommit[]] | null>;
  search: (option: {
    countTotalOnly?: boolean;
    kind: 'commit' | 'entity';
    index: string;
    query: string;
    param?: FTSearchParameters;
    restoreFn?: any;
  }) => Promise<[Error[], number, TResult[]]>;
};
