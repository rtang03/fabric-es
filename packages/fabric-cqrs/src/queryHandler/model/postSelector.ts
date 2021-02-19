import { createStructuredSelector, Selector } from 'reselect';
import type { CommitInRedis, OutputCommit } from '../types';

/**
 * @about restore redisCommit base to original Commit format, appended with additional fields
 * @see https://www.npmjs.com/package/reselect
 * @example
 * ```typescript
 * // original commit
 *  {
 *    id: 'qh_proj_test_001',
 *    entityName: 'test_proj',
 *    version: 0,
 *    commitId: '20200528133519841',
 *    entityId: 'qh_proj_test_001',
 *    mspId: 'Org1MSP',
 *    events: [ { type: 'Increment', payload: [Object] } ]
 *  }
 * // CommitInRedis - processed by preSelector
 *  {
 *    id: 'qh_proj_test_001',
 *    entityName: 'test_proj',
 *    v: '0',       // renamed
 *    commitId: '20200528133519841',
 *    entityId: 'qh_proj_test_001',
 *    mspId: 'Org1MSP',
 *    event: 'Increment', // derived field
 *    creator: 'org1-admin', // derived field
 *    evstr: [{\"type\":\"Increment\", .... \"}}]   // dervied field
 *    ts: '1590738792' // derived field
 *  }
 * // OutputCommit - processed by postSelector
 *  {
 *    id: 'qh_proj_test_001',
 *    entityName: 'test_proj',
 *    event: 'Increment',
 *    mspId: 'Org1MSP',
 *    creator: 'org1-admin',
 *    commitId: '20200528133519841',
 *    entityId: 'qh_proj_test_001',
 *    version: 0,    // converted
 *    events: [ { type: 'Increment', ... } ],   // converted
 *    ts: 1590738792
 *  }
 * ```
 */
export const postSelector: Selector<CommitInRedis, OutputCommit> = createStructuredSelector({
  id: ({ id }) => id,
  entityName: ({ entityName }) => entityName,
  commitId: ({ commitId }) => commitId,
  mspId: ({ mspId }) => mspId,
  creator: ({ creator }) => creator,
  event: ({ event }) => event,
  entityId: ({ entityId }) => entityId,
  version: (commit) => {
    let version;
    try {
      version = parseInt(commit?.v, 10);
    } catch {
      console.error('fail to parse redisCommit - version');
    }
    return version;
  },
  ts: (commit) => {
    let ts: number;
    try {
      ts = parseInt(commit?.ts, 10);
    } catch {
      console.error('fail to parse redisCommit - ts');
    }
    return ts;
  },
  events: (commit) => {
    let events;
    try {
      events = JSON.parse(commit?.evstr);
    } catch {
      console.error('fail to parse redisCommit - events');
    }
    return events;
  },
});
