import { makeKey } from './index';

export interface BaseEvent {
  readonly type: string;
  payload: any;
}

export class Commit<T extends BaseEvent = any> {
  key: string;
  id: string;
  entityName: string;
  version: number;
  commitId: string;
  committedAt: string;
  entityId: string;
  events: BaseEvent[];

  constructor({
    id,
    entityName,
    commitId,
    version,
    committedAt,
    entityId,
    events
  }: {
    id: string;
    entityName: string;
    commitId: string;
    version: number;
    committedAt: string;
    entityId: string;
    events: any;
  }) {
    this.key = makeKey([entityName, id, commitId]);
    this.id = id;
    this.entityName = entityName;
    this.version = version;
    this.commitId = commitId;
    this.committedAt = committedAt;
    this.entityId = entityId;
    this.events = events;
  }
}
