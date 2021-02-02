import type { Selector } from 'reselect';
import type { Commit } from '../../types';
import { OutputCommit } from './outputCommit';

/**
 * @about abstraction of Redis operations
 */
export type RedisRepository<TResult> = {
  // https://oss.redislabs.com/redisearch/Commands/#ftcreate
  createIndex: () => Promise<'OK'>;
  dropIndex: (deleteHash?: boolean) => Promise<'OK'>;
  // see https://redis.io/commands/hmset
  // see https://oss.redislabs.com/redisearch/Commands/#hsethsetnxhdelhincrbyhdecrby
  hmset: (item: any, history?: Commit[]) => Promise<'OK'>;
  // see https://redis.io/commands/hgetall
  hgetall: (key: string) => Promise<TResult>;
  getKey: (item: any) => string;
  getIndexName: () => string;
  getPattern: (pattern: string, args: string[]) => string;
  getPreSelector: <TInput, TOutput>() => Selector<TInput, TOutput>;
  getPostSelector: <TInput, TOutput>() => Selector<TInput, TOutput>;
  queryCommitsByPattern: (pattern: string) => Promise<[any, OutputCommit[]] | null>;
};
