import type { Commit, Reducer } from '.';

export interface QueryDatabaseResponse<TResult = any> {
  status: string;
  message: string;
  result?: TResult;
  error?: any;
}

/**
 * Query Database
 */
export interface QueryDatabase {
  /** delete [[Commit | commit]] by [[Commit.entityId | entityId]] **/
  deleteCommitByEntityId: (option: {
    entityName: string;
    id: string;
  }) => Promise<QueryDatabaseResponse<number>>;

  /* delete commit by entityName */
  deleteCommitByEntityName: (option: {
    entityName: string;
  }) => Promise<QueryDatabaseResponse<number>>;

  /* return commits by entityId */
  queryCommitByEntityId: (option: {
    entityName: string;
    id: string;
  }) => Promise<QueryDatabaseResponse<Commit[]>>;

  /* return commits by entityName */
  queryCommitByEntityName: (option: {
    entityName: string;
  }) => Promise<QueryDatabaseResponse<Commit[]>>;

  /* merge new commit */
  mergeCommit: (option: { commit: Commit }) => Promise<QueryDatabaseResponse<string[]>>;

  /* merge multiple new commits */
  mergeCommitBatch: (option: {
    entityName: string;
    commits: Record<string, Commit>;
  }) => Promise<QueryDatabaseResponse<string[]>>;

  /* merge new entity */
  mergeEntity: <TEntity = any>(entity: {
    commit: Commit;
    reducer: Reducer<TEntity>;
  }) => Promise<QueryDatabaseResponse<{ key: string; status: string }[]>>;

  /* merge multiple new entity */
  mergeEntityBatch: <TEntity>(entities: {
    entityName: string;
    commits: Record<string, Commit>;
    reducer: Reducer<TEntity>;
  }) => Promise<QueryDatabaseResponse<{ key: string; status: string }[]>>;

  /* perform full text search on commit */
  fullTextSearchCommit: (option: {
    query: string[];
    countTotalOnly?: boolean;
  }) => Promise<QueryDatabaseResponse<Commit[] | number>>;

  /* perform full text search on entity */
  fullTextSearchEntity: <TEntity = any>(option: {
    query: string[];
    countTotalOnly?: boolean;
  }) => Promise<QueryDatabaseResponse<TEntity[] | number>>;

  /* clear notification */
  clearNotification: (option: {
    creator: string;
    entityName?: string;
    id?: string;
    commitId?: string;
  }) => Promise<QueryDatabaseResponse>;

  /* return active notification */
  getNotification: (option: {
    creator: string;
    entityName?: string;
    id?: string;
    commitId?: string;
    expireNow?: boolean;
  }) => Promise<QueryDatabaseResponse<Record<string, number>[]>>;

  /* (to be deprecated) */
  queryEntity: <TEntity = any>(option: {
    entityName: string;
    where?: { [K in keyof TEntity]: TEntity[K] };
  }) => Promise<QueryDatabaseResponse<TEntity[]>>;
}
