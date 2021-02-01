import pick from 'lodash/pick';
import { createSelector, OutputSelector } from 'reselect';
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
export const postSelector: OutputSelector<CommitInRedis, OutputCommit, any> = createSelector(
  // pick some fields, which does not require processing.
  (commit) => pick(commit, 'id', 'entityName', 'commitId', 'creator', 'event', 'mspId'),
  // version selector
  (commit) => {
    let version;
    try {
      version = parseInt(commit?.v, 10);
    } catch {
      console.error('fail to parse redisCommit - version');
    }
    return { version };
  },
  // events selector
  (commit) => {
    let events;
    try {
      events = JSON.parse(commit?.evstr);
    } catch {
      console.error('fail to parse redisCommit - events');
    }
    return { events };
  },
  // ts selector
  (commit) => {
    let ts: number;
    try {
      ts = parseInt(commit?.ts, 10);
    } catch {
      console.error('fail to parse redisCommit - ts');
    }
    return { ts };
  },
  // entityId selector
  (commit) => ({ entityId: commit?.id }),
  (base, version, events, ts, entityId) => ({
    ...base,
    ...entityId,
    ...version,
    ...events,
    ...ts,
  })
);
