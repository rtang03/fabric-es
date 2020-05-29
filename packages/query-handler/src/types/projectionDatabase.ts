import { Commit, Reducer } from '@fabric-es/fabric-cqrs';

export interface ProjectionDatabaseResponse<TResult = any> {
  status: string;
  message: string;
  result?: TResult;
}

export interface ProjectionDatabase {
  merge: <TEntity = any>(item: {
    commit: Commit;
    reducer: Reducer<TEntity>;
  }) => Promise<ProjectionDatabaseResponse>;
  mergeBatch: <TEntity>(items: {
    entityName: string;
    commits: Record<string, Commit>;
    reducer: Reducer<TEntity>;
  }) => Promise<ProjectionDatabaseResponse>;
  computeEntity?: any;
  fullTextSearch?: any;
}
