import type { BaseMetaEntity, Commit, Reducer } from '../../types';
import { CommonResponse, RedisRepository, OutputCommit } from '.';
import { FTSearchParameters } from 'redis-modules-sdk';

/**
 * @about query database
 *
 * - 🔑 key format of commit *entityName::entityId::commitId*
 * - 🔑 key format of entity *entityName::entityId*
 */
export type QueryDatabaseV2 = {
  /** clear notification **/
  clearNotification: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId: string;
  }) => Promise<CommonResponse>;
  /** clear notification **/
  clearNotifications: (option: {
    creator: string;
    entityName?: string;
    id?: string;
    commitId?: string;
  }) => Promise<CommonResponse>;
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
  }) => Promise<CommonResponse<number>>;
  //
  /** delete commit by entityName **/
  deleteCommitByEntityName: (option: { entityName: string }) => Promise<CommonResponse<number>>;
  //
  /** query commits by entityId **/
  queryCommitByEntityId: (option: {
    entityName: string;
    id: string;
  }) => Promise<CommonResponse<OutputCommit[]>>;

  /** query commits by entityName **/
  queryCommitByEntityName: (option: {
    entityName: string;
  }) => Promise<CommonResponse<OutputCommit[]>>;

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
  mergeCommit: (option: { commit: Commit }) => Promise<CommonResponse<string[]>>;

  /**
   * @about merge multiple batch of commit to commit history and update index
   * **/
  mergeCommitBatch: (option: {
    entityName: string;
    commits: Record<string, Commit>;
  }) => Promise<CommonResponse<string[]>>;
  //
  mergeEntity: <TEntity extends BaseMetaEntity, TEntityInRedis extends BaseMetaEntity>(option: {
    commit: Commit;
    reducer: Reducer<TEntity>;
  }) => Promise<CommonResponse<{ key: string; status: string }[]>>;

  /** merge multiple new entity **/
  mergeEntityBatch: <TEntity>(option: {
    entityName: string;
    commits: Record<string, Commit>;
    reducer: Reducer<TEntity>;
  }) => Promise<CommonResponse<{ key: string; status: string }[]>>;

  /**
   * full text search on commit, or just return item count of result
   * @see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
   * @example [qdb.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/queryHandler/__tests__/qdb.unit-test.ts)
   * **/
  fullTextSearchCommit: (option: {
    query: string;
    param?: FTSearchParameters;
    countTotalOnly?: boolean;
  }) => Promise<CommonResponse<OutputCommit[] | number>>;

  /**
   * full text search on entity, or just return item count of result
   * @see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
   * @example query ```typescript
   * // example
   * { query: ['searching info', 'SORTBY', 'id', 'ASC'] }
   * ```
   * **/
  fullTextSearchEntity: <TEntity = any>(option: {
    entityName: string;
    query: string;
    param?: FTSearchParameters;
    countTotalOnly?: boolean;
  }) => Promise<CommonResponse<TEntity[] | number>>;

  /**
   * get active notification by commitId
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
  }) => Promise<CommonResponse<Record<string, string>>>;
  getNotificationsByFields: (option: {
    creator: string;
    entityName?: string;
    id?: string;
  }) => Promise<CommonResponse<any>>;
};
