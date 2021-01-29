import trimStart from 'lodash/trimStart';
import { RedisCommit } from '../types';

/**
 * @about options in Redis
 */
export const redisCommit: RedisCommit = {
  // Common field
  commitId: { altName: 'commitId' },
  entityName: {
    index: { type: 'TEXT', sortable: true },
  },
  /* entityId */
  id: { index: { type: 'TEXT', sortable: true } },
  mspId: { index: { type: 'TAG' } },
  version: { altName: 'v' },
  // Derived fields
  /* event name involved */
  creator: { index: { type: 'TEXT' }, preHset: ({ events }) => events[0]?.payload?._creator },
  /* stringify list of event involved */
  event: {
    index: { type: 'TAG' },
    preHset: ({ events }) =>
      trimStart(
        events.reduce<string>((prev, { type }) => `${prev},${type}`, ''),
        ','
      ),
  },
  /* stringified events */
  evstr: { preHset: ({ events }) => JSON.stringify(events) },
  /* timestamp */
  ts: {
    index: { type: 'NUMERIC', sortable: true },
    preHset: ({ events }) => events[0]?.payload?._ts || 0,
  },
};
