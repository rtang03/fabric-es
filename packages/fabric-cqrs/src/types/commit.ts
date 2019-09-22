export interface BaseEvent {
  readonly type?: string;
  payload?: any;
}

export interface Commit<TEvent extends BaseEvent = any> {
  id?: string;
  entityName?: string;
  version?: number;
  commitId?: string;
  committedAt?: string;
  entityId?: string;
  events?: TEvent[];
}
