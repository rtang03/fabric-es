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

// TODO: don't why it is omitted by typedoc
/**
 * @about BaseEntity
 */
export interface BaseEntity {
  /** entity Id **/
  id?: string;

  /** tag indexed by RediSearch **/
  tag?: string;

  /** desc indexed by RedisSearch **/
  desc?: string;

  /** creation timestamp, automatically indexed by RedisSearch **/
  _created?: number;

  /** creator, automatically indexed by RedisSearch **/
  _creator?: string;

  /** last updated timestamp, automatically indexed by RedisSearch **/
  _ts?: number;

  /** event types involved, automatically indexed by RedisSearch **/
  _event?: string;

  /** commit id involved, automatically indexed by RedisSearch **/
  _commit?: string[];

  /** entityName, automatically indexed by RedisSearch **/
  _entityName?: string;

  /** history of commits, automatically indexed by RedisSearch **/
  _timeline?: string;

  /** organization involved, automatically indexed by RedisSearch **/
  _organization?: string[];
}

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
