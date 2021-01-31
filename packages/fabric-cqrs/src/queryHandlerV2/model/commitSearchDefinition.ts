import trimStart from 'lodash/trimStart';
import { CommitSearchDefinition } from '../types';

/**
 * @about options in Redis
 */
export const commitSearchDefinition: CommitSearchDefinition = {
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
