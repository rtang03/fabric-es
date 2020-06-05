import type { Commit, Reducer } from '.';

export interface QueryDatabaseResponse<TResult = any> {
  status: string;
  message: string;
  result?: TResult;
}

export interface QueryDatabase {
  deleteCommitByEntityId: (option: {
    entityName: string;
    id: string;
  }) => Promise<QueryDatabaseResponse<number>>;
  deleteCommitByEntityName: (option: {
    entityName: string;
  }) => Promise<QueryDatabaseResponse<number>>;
  queryCommitByEntityId: (option: {
    entityName: string;
    id: string;
  }) => Promise<QueryDatabaseResponse<Record<string, Commit>>>;
  queryCommitByEntityName: (option: {
    entityName: string;
  }) => Promise<QueryDatabaseResponse<Record<string, Commit>>>;
  mergeCommit: (option: { commit: Commit }) => Promise<QueryDatabaseResponse<string[]>>;
  mergeCommitBatch: (option: {
    entityName: string;
    commits: Record<string, Commit>;
  }) => Promise<QueryDatabaseResponse<string[]>>;
  mergeEntity: <TEntity = any>(entity: {
    commit: Commit;
    reducer: Reducer<TEntity>;
  }) => Promise<QueryDatabaseResponse<{ key: string; status: string }[]>>;
  mergeEntityBatch: <TEntity>(entities: {
    entityName: string;
    commits: Record<string, Commit>;
    reducer: Reducer<TEntity>;
  }) => Promise<QueryDatabaseResponse<{ key: string; status: string }[]>>;
  fullTextSearchCommit: <TEntity = any>(option: {
    query: string;
  }) => Promise<QueryDatabaseResponse<Record<string, TEntity>>>;
  fullTextSearchEntity: <TEntity = any>(option: {
    query: string;
  }) => Promise<QueryDatabaseResponse<Record<string, TEntity>>>;
}
