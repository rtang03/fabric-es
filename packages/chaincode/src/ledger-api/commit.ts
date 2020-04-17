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
  entityId: string;
  events: BaseEvent[];
  hash?: string;
  isFirst?: boolean;
  isLast?: boolean;

  constructor(option: {
    id: string;
    entityName: string;
    commitId: string;
    version: number;
    entityId: string;
    events: any;
    hash?: string;
    isFirst?: boolean;
    isLast?: boolean;
  }) {
    this.key = makeKey([option.entityName, option.id, option.commitId]);
    this.id = option.id;
    this.entityName = option.entityName;
    this.version = option.version;
    this.commitId = option.commitId;
    this.entityId = option.entityId;
    this.events = option.events;
    if (option.hash) this.hash = option.hash;
    if (option.isFirst === true || option.isFirst === false) this.isFirst = option.isFirst;
    if (option.isLast === true || option.isLast === false) this.isLast = option.isLast;
  }
}
