import { Commit } from '../types';

export type Repository<TEntity = any, TEvent = any> = {
  create: (
    id: string
  ) => {
    save: (events: TEvent[]) => Promise<Commit | { error: any }>;
  };
  getByEntityName: () => Promise<{ entities: TEntity[] }>;
  getById: (
    id: string
  ) => Promise<{
    currentState: TEntity;
    save: (
      events: TEvent[],
      version?: number
    ) => Promise<Commit | { error: any }>;
  }>;
  getCommitById: (id: string) => Promise<{ commits: Commit[] }>;
  getProjection: ({
    where,
    all,
    contain
  }: {
    where?: Record<string, string>;
    all?: boolean;
    contain?: string;
  }) => Promise<{ projections: TEntity[] }>;
  deleteByEntityId?: (id: string) => Promise<any>;
  deleteByEntityName_query?: () => Promise<any>;
};
