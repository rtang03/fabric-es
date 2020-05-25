import { Commit } from '@fabric-es/fabric-cqrs';
import { QueryDatabaseResponse } from './queryDatabaseResponse';

export interface QueryDatabase {
  deleteByEntityId: (option: { entityName: string; id: string }) => Promise<QueryDatabaseResponse>;
  deleteByEntityName: (option: { entityName: string }) => Promise<QueryDatabaseResponse>;
  queryByEntityId: (option: {
    entityName: string;
    id: string;
  }) => Promise<QueryDatabaseResponse<Record<string, Commit>>>;
  queryByEntityName: (option: { entityName: string }) => Promise<QueryDatabaseResponse<Record<string, Commit>>>;
  merge: (option: { entityName: string; commit: Commit }) => Promise<QueryDatabaseResponse<string[]>>;
  mergeBatch: (option: {
    entityName: string;
    commits: Record<string, Commit>;
  }) => Promise<QueryDatabaseResponse<string[]>>;
}
