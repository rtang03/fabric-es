import { Commit } from '../types';

/**
 * **PrivatedataRepository**
 * @typeparam TEntity entity type
 * @typeparam TEvent event type
 */
export interface PrivatedataRepository<TEntity = any, TEvent = any> {
  /**
   * **create** return _save_ function for writing events to Fabric
   * @param option `option: { enrollmentId: string; id: string; }`
   * @returns `{
   *    save: (events: TEvent[]) => Promise<Commit | { error: any }>;
   * }`
   */
  create: (option: {
    enrollmentId: string;
    id: string;
  }) => {
    save: (events: TEvent[]) => Promise<Commit | { error: any }>;
  };

  /**
   * **getByEntityName** return entity array
   * @returns `{ data: TEntity[] }`
   */
  getByEntityName: () => Promise<{ data: TEntity[] }>;

  /**
   * **getById** return _currentState_ and _save_function by entityId, and enrollmentId
   * @param option `option: { enrollmentId: string; id: string; }`
   * @returns `{
   *  currentState: TEntity;
   *  save: (events: TEvent[], version?: number) => Promise<Commit | { error: any }>;
   * }`
   */
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: (events: TEvent[], version?: number) => Promise<Commit | { error: any }>;
  }>;

  /**
   * **deleteByEntityIdCommitId** delete commits by entityId and commitId. Mainly used for test scenarios
   * @param id entityId
   * @param commitId commitId
   * @returns `Record<string, any>`
   */
  deleteByEntityIdCommitId?: (id: string, commitId: string) => Promise<Record<string, any>>;

  /** **getEntityName** return entity name */
  getEntityName: () => string;
}
