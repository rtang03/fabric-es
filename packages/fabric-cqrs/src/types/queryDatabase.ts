import { Commit } from './commit';

/**
 * **QueryDatabase** query database
 */
export interface QueryDatabase {
  /**
   * **deleteByEntityId** delete commit by entity id
   * @param option `deleteByEntityIdOption: { entityName: string; id: string }`
   * @returns `{ status: string }`
   */
  deleteByEntityId: (deleteByEntityIdOption: { entityName: string; id: string }) => Promise<{ status: string }>;

  /**
   * **deleteByEntityName** delete commits by entity name
   * @param option `deleteByEntityNameOption: { entityName: string }`
   * @returns `{ status: string }`
   */
  deleteByEntityName: (deleteByEntityNameOption: { entityName: string }) => Promise<{ status: string }>;

  /**
   * **queryByEntityId** query commits by entity id
   * @param option `queryByEntityIdOption: {
   *   entityName: string;
   *   id: string;
   * }`
   * @returns `{ data: Record<string, Commit> }`
   */
  queryByEntityId: (queryByEntityIdOption: {
    entityName: string;
    id: string;
  }) => Promise<{ data: Record<string, Commit> }>;

  /**
   * **queryByEntityName** query commits by entity name
   * @param option `queryByEntityNameOption: { entityName: string }`
   * @returns `{ data: Record<string, Commit> }`
   */
  queryByEntityName: (queryByEntityNameOption: { entityName: string }) => Promise<{ data: Record<string, Commit> }>;

  /**
   * **merge** merge single commit onto query database
   * @param option `mergeOption: { commit: Commit }`
   * @returns `{ data: Record<string, Commit> }`
   */
  merge: (mergeOption: { commit: Commit }) => Promise<{ data: Record<string, Commit> }>;

  /**
   * **mergeBatch** merge multiple commits onto query database
   * @param option `mergeBatchOption: {
   *  entityName: string;
   *  commits: Record<string, Commit>;
   *  }`
   * @returns `{ data: Record<string, Commit> }`
   */
  mergeBatch: (mergeBatchOption: {
    entityName: string;
    commits: Record<string, Commit>;
  }) => Promise<{ data: Record<string, Commit> }>;
}
