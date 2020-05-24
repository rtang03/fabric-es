import { Commit } from '@fabric-es/fabric-cqrs';
import { QueryDatabaseResponse } from './queryDatabaseResponse';

export interface QueryDatabase {
  deleteByEntityId: (deleteByEntityIdOption: { entityName: string; id: string }) => Promise<{ status: string }>;
  deleteByEntityName: (deleteByEntityNameOption: { entityName: string }) => Promise<{ status: string }>;
  queryByEntityId: (queryByEntityIdOption: {
    entityName: string;
    id: string;
  }) => Promise<{ data: Record<string, Commit> }>;
  queryByEntityName: (queryByEntityNameOption: { entityName: string }) => Promise<{ data: Record<string, Commit> }>;
  merge: (mergeOption: { commit: Commit }) => Promise<{ data: Record<string, Commit> }>;
  mergeBatch: (mergeBatchOption: {
    entityName: string;
    commits: Record<string, Commit>;
  }) => Promise<QueryDatabaseResponse>;
}
