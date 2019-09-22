import { Commit } from './commit';
import { Reducer } from './reducer';

export interface ProjectionDb<TEntity = any> {
  find: ({
    all,
    contain,
    where
  }: {
    where?: Record<string, any>;
    all?: boolean;
    contain?: string | number;
  }) => Promise<{ data: { id: string } & TEntity }>;
  upsert: ({
    commit,
    reducer
  }: {
    commit: Record<string, Commit>;
    reducer: Reducer;
  }) => Promise<{ data: Record<string, {}> }>;
  upsertMany: ({
    commits,
    reducer
  }: {
    commits: Record<string, Commit>;
    reducer: Reducer;
  }) => Promise<{ data: Record<string, {}> }>;
}
