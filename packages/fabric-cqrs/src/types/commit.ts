import { BaseEntity } from '.';

/**
 * @ignore
 */
export interface EntityType<TEntity extends BaseEntity> {
  new (...args: any[]): TEntity;
  parentName?: string;
  entityName: string;
}

/**
 * **Lifecycle**
 * Entity lifecycle markers
 * BEGIN  - start of lifecycle, only appear once as the first event
 * END    - end of lifecycle, only appear once as the last event
 * NORMAL - other events without restriction
 * @ignore
 */
export enum Lifecycle {
  NORMAL,
  BEGIN,
  END,
}

export type BaseEvent = {
  /** event type **/
  readonly type?: string;

  /** lifecycle type **/
  readonly lifeCycle?: Lifecycle;

  /** event payload **/
  payload?: any;
};

/**
 * @about Commit
 */
export type Commit = {
  /** commit Id (same as commitId) **/
  id: string;

  /** entity name **/
  entityName: string;

  /** version number **/
  version?: number;

  /** commit Id **/
  commitId?: string;

  /** entity Id **/
  entityId?: string;

  /** organization Id **/
  mspId?: string;

  /** events array **/
  events?: BaseEvent[];

  /** hash of privatedata's events string **/
  hash?: string;

  /** stringified events **/
  eventsString?: string;
};
