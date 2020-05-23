import { Commit, Reducer } from '@fabric-es/fabric-cqrs';

export interface ProjectionDatabase<TEntity = any> {
  find: (criteria: {
    where?: Record<string, any>;
    all?: boolean;
    contain?: string | number;
  }) => Promise<{ data: { id: string } & TEntity }>;
  upsert: (item: { commit: Record<string, Commit>; reducer: Reducer }) => Promise<{ data: Record<string, {}> }>;
  upsertMany: (items: { commits: Record<string, Commit>; reducer: Reducer }) => Promise<{ data: Record<string, {}> }>;
}
