import { Commit } from '@fabric-es/fabric-cqrs';

export interface QueryDatabaseResponse<TResult = any> {
  status: string;
  message: string;
  result?: TResult;
}

export interface QueryDatabase {
  deleteByEntityId: (option: { entityName: string; id: string }) => Promise<QueryDatabaseResponse>;
  deleteByEntityName: (option: { entityName: string }) => Promise<QueryDatabaseResponse>;
  queryByEntityId: (option: {
    entityName: string;
    id: string;
  }) => Promise<QueryDatabaseResponse<Record<string, Commit>>>;
  queryByEntityName: (option: {
    entityName: string;
  }) => Promise<QueryDatabaseResponse<Record<string, Commit>>>;
  merge: (option: { commit: Commit }) => Promise<QueryDatabaseResponse<string[]>>;
  mergeBatch: (option: {
    entityName: string;
    commits: Record<string, Commit>;
  }) => Promise<QueryDatabaseResponse<string[]>>;
  fullTextSearch: (option: { query: string }) => Promise<QueryDatabaseResponse>;
}
