/**
 * TODO: This is confusing to use class for BaseEntity. May later clean it up
 * @ignore
 */
export class BaseEntity {
  static parentName: string;
  static entityName: string;
  public static getParentName(): string {
    return this.parentName;
  }
  public static getEntityName(): string {
    return this.entityName;
  }
  constructor() {}
}

/**
 * @ignore
 */
export interface EntityClass<TEntity extends BaseEntity> {
  new (...args: any[]): TEntity;
  parentName: string;
  entityName: string;
}

/**
 * **Lifecycle**
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
