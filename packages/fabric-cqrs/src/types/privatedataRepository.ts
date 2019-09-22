import { Commit } from '../types';

export type PrivatedataRepository<TEntity = any, TEvent = any> = {
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
  deleteByEntityIdCommitId?: (
    id: string,
    commitId: string
  ) => Promise<Record<string, any>>;
};
