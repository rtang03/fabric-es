import type { CommitSearchDefinition } from '../types';

/**
 * @about Redisearch index definition of [[CommitInRedis]].
 * This is internal use only.
 */
export const commitSearchDefinition: CommitSearchDefinition = {
  commitId: {},
  entityName: {
    index: { type: 'TEXT', sortable: true },
  },
  /** same as entityId **/
  id: { index: { type: 'TEXT', sortable: true } },
  /** MSP Id **/
  mspId: { index: { type: 'TAG' } },
  version: {},
  /** Derived field of _creator event name involved **/
  creator: { index: { type: 'TEXT' } },
  /** Derived field of _event - it indicates event name included in this commit **/
  event: { index: { type: 'TAG' } },
  /** Derived field of stringified events **/
  evstr: {},
  /** Derived field of _ts, i.e. timestamp **/
  ts: { index: { type: 'NUMERIC', sortable: true } },
  signedRequest: {},
};
