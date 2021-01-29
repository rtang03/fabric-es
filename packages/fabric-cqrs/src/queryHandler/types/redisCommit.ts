import trimStart from 'lodash/trimStart';
import { Commit } from '../../types';
import { MapField } from './mapField';

/**
 * @about derived new field
 */
export type DerivedCommit = {
  creator: string;
  evstr: string;
  event: string;
  ts: number;
};

/**
 * @about selected field of commit
 */
export type CommonCommit = Pick<
  Commit,
  'id' | 'commitId' | 'entityName' | 'mspId' | 'version' | 'events'
>;

/**
 * @about type defintion of commit in Redis
 */
export type RedisCommit = MapField<CommonCommit & DerivedCommit>;

/**
 * @about options in Redis
 */
const redisCommit: RedisCommit = {
  // Common field
  commitid: { altName: 'cid' },
  entityname: {
    altName: 'type',
    index: { type: 'TEXT', sortable: true },
  },
  /* entityId */
  id: { index: { type: 'TEXT', sortable: true } },
  mspid: { altName: 'msp', index: { type: 'TAG' } },
  version: { altName: 'v' },
  // Derived fields
  /* event name involved */
  creator: { index: { type: 'TEXT' }, transform: ({ events }) => events[0]?.payload?._creator },
  /* stringify list of event involved */
  event: {
    index: { type: 'TAG' },
    transform: ({ events }) =>
      trimStart(
        events.reduce<string>((prev, { type }) => `${prev},${type}`, ''),
        ','
      ),
  },
  /* stringified events */
  evstr: { transform: ({ events }) => JSON.stringify(events) },
  /* timestamp */
  ts: {
    index: { type: 'NUMERIC', sortable: true },
    transform: ({ events }) => events[0]?.payload?._ts || 0,
  },
};
