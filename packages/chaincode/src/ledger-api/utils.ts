import { assign } from 'lodash';
import { Commit } from './commit';

export const splitKey = (key: string) => key.split('~');

export const makeKey = (keyParts: any[]) => keyParts.map(part => JSON.stringify(part)).join('~');

export const serialize = object => Buffer.from(JSON.stringify(object));

export const toRecord = (commit: Partial<Commit>) => assign({}, { [commit.commitId]: commit });

export const createCommitId = () => `${new Date(Date.now()).toISOString().replace(/[^0-9]/g, '')}`;

export const createInstance = (option: {
  id: string;
  entityName: string;
  version: string;
  events: any[];
  commitId: string;
}) =>
  new Commit({
    id: option.id,
    entityName: option.entityName,
    commitId: option.commitId,
    version: parseInt(option.version, 10),
    events: option.events,
    entityId: option.id
  });

// type guard for transient data
export const isEventArray = (value: unknown): value is { type: string; lifeCycle?: number; payload?: any }[] =>
  Array.isArray(value) && value.every(item => typeof item.type === 'string');
