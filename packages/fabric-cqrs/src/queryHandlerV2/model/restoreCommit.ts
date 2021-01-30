import pick from 'lodash/pick';
import { createSelector, OutputSelector } from 'reselect';
import type { CommitInRedis, ReselectedCommit } from '../types';

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
 * // CommitInRedis
 *  {
 *    id: 'qh_proj_test_001',
 *    entityName: 'test_proj',
 *    v: '0',
 *    commitId: '20200528133519841',
 *    entityId: 'qh_proj_test_001',
 *    mspId: 'Org1MSP',
 *    events: [ { type: 'Increment', payload: [Object] } ]
 *    event: 'Increment',
 *    creator: 'org1-admin',
 *    evstr: [{\"type\":\"Increment\",\"payload\": .... \"}}]
 *  }
 * // ReselectedCommitAfterRedis
 *  {
 *    id: 'qh_proj_test_001',
 *    entityName: 'test_proj',
 *    event: 'Increment',
 *    mspId: 'Org1MSP',
 *    creator: 'org1-admin',
 *    commitId: '20200528133519841',
 *    entityId: 'qh_proj_test_001',
 *    version: 0,
 *    events: [ { type: 'Increment', payload: [Object] } ],
 *    ts: 1590738792000
 *  }
 * ```
 */
export const restoreCommit: OutputSelector<CommitInRedis, ReselectedCommit, any> = createSelector(
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
      ts *= 1000;
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
