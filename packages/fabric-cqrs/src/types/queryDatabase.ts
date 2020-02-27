import { Commit } from './commit';

export interface QueryDatabase {
  deleteByEntityId: ({ entityName, id }: { entityName: string; id: string }) => Promise<{ status: string }>;
  deleteByEntityName: ({ entityName }: { entityName: string }) => Promise<{ status: string }>;
  queryByEntityId: ({
    entityName,
    id
  }: {
    entityName: string;
    id: string;
  }) => Promise<{ data: Record<string, Commit> }>;
  queryByEntityName: ({ entityName }: { entityName: string }) => Promise<{ data: Record<string, Commit> }>;
  merge: ({ commit }: { commit: Commit }) => Promise<{ data: Record<string, Commit> }>;
  mergeBatch: ({
    entityName,
    commits
  }: {
    entityName: string;
    commits: Record<string, Commit>;
  }) => Promise<{ data: Record<string, Commit> }>;
}
