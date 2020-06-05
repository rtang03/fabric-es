/**
 * **Lifecycle**
 * BEGIN  - start of lifecycle, only appear once as the first event
 * END    - end of lifecycle, only appear once as the last event
 * NORMAL - other events without restriction
 */
export enum Lifecycle {
  NORMAL,
  BEGIN,
  END
}

/**
 * **BaseEvent**
 */
export interface BaseEvent {
  /** event type */
  readonly type?: string;

  /** lifecycle type */
  readonly lifeCycle?: Lifecycle;

  /** organization id */
  mspId?: string;

  /** event payload */
  payload?: any;
}

/** */
export interface EntityClass<TEntity extends BaseEntity> {
  new (...args: any[]): TEntity;
  parentName: string;
  entityName: string;
}
export class BaseEntity {
  static parentName: string;
  static entityName: string;
  public static getParentName(): string {
    return this.parentName;
  }
  public static getEntityName(): string {
    return this.entityName;
  }
  constructor () {}

  /** array of mspId for private data tracking */
  tracking?: string[];
}

/**
 * **Commit**
 */
export interface Commit {
  /** commit Id */
  id: string;

  /** entity name */
  entityName: string;

  /** version number */
  version?: number;

  /** commit Id */
  commitId?: string;

  /** entity Id */
  entityId?: string;

  /** organization Id */
  mspId?: string;

  /** events array */
  events?: BaseEvent[];

  /** hash of privatedata's events string */
  hash?: string;
}
