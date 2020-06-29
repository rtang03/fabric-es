import type { Commit, Reducer } from '.';

export interface QueryDatabaseResponse<TResult = any> {
  status: string;
  message: string;
  result?: TResult;
  error?: any;
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
  }) => Promise<QueryDatabaseResponse<Commit[]>>;
  queryCommitByEntityName: (option: {
    entityName: string;
  }) => Promise<QueryDatabaseResponse<Commit[]>>;
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
  fullTextSearchCommit: (option: {
    query: string[];
    countTotalOnly?: boolean;
  }) => Promise<QueryDatabaseResponse<Commit[] | number>>;
  fullTextSearchEntity: <TEntity = any>(option: {
    query: string[];
    countTotalOnly?: boolean;
  }) => Promise<QueryDatabaseResponse<TEntity[] | number>>;
  fullTextSearchGetDocument: (option: {
    index: string;
    documentId: string;
  }) => Promise<QueryDatabaseResponse>;
  fullTextSearchTagVals: (option: { index: string; tag: string }) => Promise<QueryDatabaseResponse>;
  queryEntity: <TEntity = any>(option: {
    entityName: string;
    where?: { [K in keyof TEntity]: TEntity[K] };
  }) => Promise<QueryDatabaseResponse<TEntity[]>>;
}
