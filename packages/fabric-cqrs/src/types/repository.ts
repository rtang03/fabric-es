import { Commit } from '.';

/**
 * **PrivatedataRepository**
 * @typeparam TEntity entity type
 * @typeparam TEvent event type
 */
export interface Repository<TEntity = any, TEvent = any> {
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
   * **getCommitById** return [[Commit]] array by entity id
   * @param id id
   * @returns `{ data: Commit[] }`
   */
  getCommitById: (id: string) => Promise<{ data: Commit[] }>;

  /**
   * **getProjection** return Entity object from projection database, based on ONE of criteria, 'where',
   * 'all' or 'contain'.
   * @param where `search by where; e.g. { where: { id: 123 } }`
   * @param all `get all, e.g. { all: true }`
   * @param contain `search by one keyword; e.g. { contain: '123' }`
   * @returns `{ data: TEntity[] }`
   * @example `getProjection( { where: { id: '123' } } )`
   */
  getProjection: (projectionCriteria: {
    where?: Record<string, string>;
    all?: boolean;
    contain?: string;
  }) => Promise<{ data: TEntity[] }>;

  /**
   * **deleteByEntityId** delete commits by entityId. Mainly used in test scenarios
   * @param id entityId
   * @returns `any`
   */
  deleteByEntityId?: (id: string) => Promise<any>;

  /**
   * **deleteByEntityName_query** delete all commits by entityId from query database. Mainly used in test scenarios
   * @returns `any`
   */
  deleteByEntityName_query?: () => Promise<any>;

  /** **getEntityName** return entity name */
  getEntityName: () => string;
}
