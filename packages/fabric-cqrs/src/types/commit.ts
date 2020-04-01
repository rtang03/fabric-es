/**
 * **BaseEvent**
 */
export interface BaseEvent {
  /** event type */
  readonly type?: string;

  /** event payload */
  payload?: any;
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
  version: number;

  /** commit Id */
  commitId: string;

  /** entity Id */
  entityId: string;

  /** events array */
  events?: BaseEvent[];
}
