import { Commit } from './commit';
import { Reducer } from './reducer';

/**
 * **ProjectionDb** projection database
 */
export interface ProjectionDb<TEntity = any> {
  /**
   * **find** return entity by criteria
   * @param criteria `criteria: {
   *   where?: Record<string, any>;
   *   all?: boolean;
   *   contain?: string | number;
   *  }`
   * @returns `{ data: { id: string } & TEntity }`
   */
  find: (criteria: {
    where?: Record<string, any>;
    all?: boolean;
    contain?: string | number;
  }) => Promise<{ data: { id: string } & TEntity }>;

  /**
   * **upsert** upsert a commit with reducer
   * @param item `item: { commit: Record<string, Commit>; reducer: Reducer }`
   * @returns `{ data: Record<string, {}> }`
   */
  upsert: (item: { commit: Record<string, Commit>; reducer: Reducer }) => Promise<{ data: Record<string, {}> }>;

  /**
   * **upsertMany** upsert multiple commits with reducer
   * @param items `items: { commits: Record<string, Commit>; reducer: Reducer }`
   * @returns `{ data: Record<string, {}> }`
   */
  upsertMany: (items: { commits: Record<string, Commit>; reducer: Reducer }) => Promise<{ data: Record<string, {}> }>;
}
