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

  /** event payload */
  payload?: any;
}

export interface BaseEntity {
  _created: number;
  _creator: string;
  _ts: number;
  __event?: string;
  __commit?: string[];
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

  /** events array */
  events?: BaseEvent[];

  /** hash of privatedata's events string */
  hash?: string;

  eventsString?: string;
}
