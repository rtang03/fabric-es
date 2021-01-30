import type { Commit, Reducer } from '../../types';
import { QueryDatabaseResponse, RedisRepository, ReselectedCommitAfterRedis } from '.';

/**
 * @about query database
 *
 * - 🔑 key format of commit *entityName::entityId::commitId*
 * - 🔑 key format of entity *entityName::entityId*
 */
export type QueryDatabaseV2 = {
  getRedisCommitRepo: () => RedisRepository<ReselectedCommitAfterRedis>;
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
  // deleteCommitByEntityId: (option: {
  //   entityName: string;
  //   id: string;
  // }) => Promise<QueryDatabaseResponse<number>>;
  //
  // /** delete commit by entityName **/
  // deleteCommitByEntityName: (option: {
  //   entityName: string;
  // }) => Promise<QueryDatabaseResponse<number>>;
  //
  // /** query commits by entityId **/
  // queryCommitByEntityId: (option: {
  //   entityName: string;
  //   id: string;
  // }) => Promise<QueryDatabaseResponse<Commit[]>>;
  //
  // /** query commits by entityName **/
  // queryCommitByEntityName: (option: {
  //   entityName: string;
  // }) => Promise<QueryDatabaseResponse<Commit[]>>;

  /**
   * merge new commit
   * 1. append single commit to commit history
   * 1. update cidx index
   *
   * @return ```typescript
   * // example
   * {
   *   status:
   *   message:
   *   result: array_of_unique_redis_keys
   * }
   * ```
   * **/
  mergeCommit: (option: { commit: Commit }) => Promise<QueryDatabaseResponse<string[]>>;

  /**
   * merge multiple new commits
   * 1. append batch of commit to commit history
   * 1. update cidx index
   * **/
  // mergeCommitBatch: (option: {
  //   entityName: string;
  //   commits: Record<string, Commit>;
  // }) => Promise<QueryDatabaseResponse<string[]>>;
  //
  // mergeEntity: <TEntity = any>(entity: {
  //   commit: Commit;
  //   reducer: Reducer<TEntity>;
  // }) => Promise<QueryDatabaseResponse<{ key: string; status: string }[]>>;

  /** merge multiple new entity **/
  // mergeEntityBatch: <TEntity>(entities: {
  //   entityName: string;
  //   commits: Record<string, Commit>;
  //   reducer: Reducer<TEntity>;
  // }) => Promise<QueryDatabaseResponse<{ key: string; status: string }[]>>;

  /**
   * full text search on commit, or just return item count of result
   * @see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
   * @example [qdb.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/queryHandler/__tests__/qdb.unit-test.ts)
   * **/
  // fullTextSearchCommit: (option: {
  //   query: string[];
  //   countTotalOnly?: boolean;
  // }) => Promise<QueryDatabaseResponse<Commit[] | number>>;

  /**
   * full text search on entity, or just return item count of result
   * @see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
   * @example query ```typescript
   * // example
   * { query: ['searching info', 'SORTBY', 'id', 'ASC'] }
   * ```
   * **/
  // fullTextSearchEntity: <TEntity = any>(option: {
  //   query: string[];
  //   countTotalOnly?: boolean;
  // }) => Promise<QueryDatabaseResponse<TEntity[] | number>>;

  /** clear notification **/
  // clearNotification: (option: {
  //   creator: string;
  //   entityName?: string;
  //   id?: string;
  //   commitId?: string;
  // }) => Promise<QueryDatabaseResponse>;

  /**
   * get active notification by commitId
   * @return ```typescript
   * // example
   * {
   *   status,
   *   message: 'xxx records returned',
   *   result: [{ 'any-commitId': NotificationDetails }]
   * }
   * ```
   * **/
  // getNotification: (option: {
  //   creator: string;
  //   entityName?: string;
  //   id?: string;
  //   commitId?: string;
  //   expireNow?: boolean;
  // }) => Promise<QueryDatabaseResponse<Record<string, number>[]>>;
};
