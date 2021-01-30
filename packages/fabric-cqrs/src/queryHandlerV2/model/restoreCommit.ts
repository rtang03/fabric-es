import util from 'util';
import pick from 'lodash/pick';
import { createSelector, OutputSelector } from 'reselect';
import { CommitInRedis, ReselectedCommitAfterRedis } from '../types';

// remove original fields
const base: (
  commit: CommitInRedis
) => {
  id: string;
  entityName: string;
  commitId?: string;
  version?: string;
  event: string;
  mspId: string;
} = (commit) => pick(commit, 'id', 'entityName', 'commitId', 'creator', 'event', 'mspId');

const versionSelector: (commit: CommitInRedis) => { version: number } = (commit) => {
  let version;
  try {
    version = parseInt(commit?.v, 10);
  } catch (e) {
    console.error(util.format('fail to parse redisCommit, %j', e));
    version = null;
  }
  return { version };
};

const eventsSelector: (commit: CommitInRedis) => { events: Record<string, unknown>[] } = (
  commit
) => {
  let events;
  try {
    events = JSON.parse(commit?.evstr);
  } catch (e) {
    console.error(util.format('fail to parse redisCommit, %j', e));
    events = null;
  }
  return { events };
};

const tsSelector: (commit: CommitInRedis) => { ts: number } = (commit) => {
  let ts: number;
  try {
    ts = parseInt(commit?.ts, 10);
    ts *= 1000;
  } catch (e) {
    console.error(util.format('fail to parse redisCommit, %j', e));
    ts = null;
  }
  return { ts };
};

const entityIdSelector: (commit: CommitInRedis) => { entityId: string } = (commit) => ({
  entityId: commit?.id,
});

/**
 * @about restore redisCommit base to original Commit format, appended with additional fields
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
export const restoreCommit: OutputSelector<
  CommitInRedis,
  ReselectedCommitAfterRedis,
  any
> = createSelector(
  base,
  versionSelector,
  eventsSelector,
  tsSelector,
  entityIdSelector,
  (base, version, events, ts, entityId) => ({
    ...base,
    ...entityId,
    ...version,
    ...events,
    ...ts,
  })
);
