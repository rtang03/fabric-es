import type { FTSearchParameters } from 'redis-modules-sdk';
import type { BaseMetaEntity, Commit, HandlerResponse, Reducer } from '../../types';
import type { RedisRepository, OutputCommit } from '.';

export type QueryDatabaseResponse<TResult = any> = {
  status: string;
  message: string;
  result?: TResult;
  error?: any;
};

/**
 * @about Query database
 *
 * - 🔑 key format of commit c:entityName:entityId:commitId*
 * - 🔑 key format of entity e:entityName:entityId*
 */
export type QueryDatabase = {
  /** clear one notification **/
  clearNotification: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId: string;
  }) => Promise<HandlerResponse<string[]>>;

  /** clear all notifications **/
  clearNotifications: (option: {
    creator: string;
    entityName?: string;
    id?: string;
    commitId?: string;
  }) => Promise<HandlerResponse<string[]>>;

  getRedisCommitRepo: () => RedisRepository<OutputCommit>;
  /**
   * delete commit by entityId
   * @return ```typescript
   * // example
   * {
   *   status: 'OK',
   *   message: `XX records are removed`,
   *   result: number_of_records_deleted,
   * }
   * ```
   * **/
  deleteCommitByEntityId: (option: {
    entityName: string;
    id: string;
  }) => Promise<HandlerResponse<number>>;

  /** delete commit by entityName **/
  deleteCommitByEntityName: (option: { entityName: string }) => Promise<HandlerResponse<number>>;

  /* delete entity by entityName */
  deleteEntityByEntityName: (option: { entityName: string }) => Promise<HandlerResponse<number>>;

  /** query commits by entityId **/
  queryCommitByEntityId: (option: {
    entityName: string;
    id: string;
  }) => Promise<HandlerResponse<OutputCommit[]>>;

  /** query commits by entityName **/
  queryCommitByEntityName: (option: {
    entityName: string;
  }) => Promise<HandlerResponse<OutputCommit[]>>;

  /**
   * @about merge single commit to commit history, and update index
   * @return ```typescript
   * // example
   * {
   *   status:
   *   message:
   *   result: array_of_unique_redis_keys
   * }
   * ```
   * **/
  mergeCommit: (option: { commit: Commit }) => Promise<HandlerResponse<string[]>>;

  /**
   * @about merge multiple batch of commit to commit history and update index
   * **/
  mergeCommitBatch: (option: {
    entityName: string;
    commits: Record<string, Commit>;
  }) => Promise<HandlerResponse<string[]>>;
  //
  mergeEntity: <TEntity extends BaseMetaEntity, TEntityInRedis extends BaseMetaEntity>(option: {
    commit: Commit;
    reducer: Reducer<TEntity>;
  }) => Promise<HandlerResponse<{ key: string; status: string }[]>>;

  /** merge multiple new entity **/
  mergeEntityBatch: <TEntity>(option: {
    entityName: string;
    commits: Record<string, Commit>;
    reducer: Reducer<TEntity>;
  }) => Promise<HandlerResponse<{ key: string; status: string }[]>>;

  /**
   * full text search on commit, or just return item count of result
   * @see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
   * @example [qdb.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/queryHandler/__tests__/qdb.unit-test.ts)
   * **/
  fullTextSearchCommit: (option: {
    query: string;
    param?: FTSearchParameters;
    countTotalOnly?: boolean;
  }) => Promise<HandlerResponse<OutputCommit[] | number>>;

  /**
   * full text search on entity, or just return item count of result
   * @see FTSearchParameters is defined by `node_modules/redis-modules-sdk/lib/modules/redisearch.d.ts`
   * @see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
   * @example query
   * ```typescript
   * // example
   * {
   *    entityName: 'counter'
   *    query: 'some_input*'
   *    cursor: 0,
   *    pagesize: 10,
   *    param: { sortBy: { sort: 'ASC', field: 'de' } }
   * }
   * ```
   * **/
  fullTextSearchEntity: <TEntity = any>(option: {
    entityName: string;
    query: string;
    param?: FTSearchParameters;
    countTotalOnly?: boolean;
  }) => Promise<HandlerResponse<TEntity[] | number>>;

  /**
   * @about get active notification by commitId
   * @return ```typescript
   * // example
   * {
   *   status,
   *   result:
   * }
   * ```
   * **/
  getNotification: (option: {
    creator: string;
    entityName?: string;
    id?: string;
    commitId?: string;
  }) => Promise<HandlerResponse<Record<string, string>>>;

  /**
   * @about get list of notifications
   */
  getNotificationsByFields: (option: {
    creator: string;
    entityName?: string;
    id?: string;
  }) => Promise<HandlerResponse<Record<string, string>>>;
};
