import trimStart from 'lodash/trimStart';
import { CommitSearchDefinition } from '../types';

/**
 * @about options in Redis
 */
export const commitSearchDefinition: CommitSearchDefinition = {
  // Common field
  commitId: {},
  entityName: {
    index: { type: 'TEXT', sortable: true },
  },
  /* entityId */
  id: { index: { type: 'TEXT', sortable: true } },
  mspId: { index: { type: 'TAG' } },
  version: {},
  // Derived fields
  /* event name involved */
  creator: { index: { type: 'TEXT' } },
  /* stringify list of event involved */
  event: { index: { type: 'TAG' } },
  /* stringified events */
  evstr: {},
  /* timestamp */
  ts: { index: { type: 'NUMERIC', sortable: true } },
};
