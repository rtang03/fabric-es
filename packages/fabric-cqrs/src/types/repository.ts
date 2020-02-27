import { Commit } from '.';

export interface Repository<TEntity = any, TEvent = any> {
  create: (option: {
    enrollmentId: string;
    id: string;
  }) => {
    save: (events: TEvent[]) => Promise<Commit | { error: any }>;
  };
  getByEntityName: () => Promise<{ data: TEntity[] }>;
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: (events: TEvent[], version?: number) => Promise<Commit | { error: any }>;
  }>;
  getCommitById: (id: string) => Promise<{ data: Commit[] }>;
  getProjection: ({
    where,
    all,
    contain
  }: {
    where?: Record<string, string>;
    all?: boolean;
    contain?: string;
  }) => Promise<{ data: TEntity[] }>;
  deleteByEntityId?: (id: string) => Promise<any>;
  deleteByEntityName_query?: () => Promise<any>;
  getEntityName: () => string;
}
