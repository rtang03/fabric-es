import util from 'util';
import omit from 'lodash/omit';
import { createSelector, OutputSelector } from 'reselect';

// remove original fields
const base = (commit) => omit(commit, 'events', 'v', 'evstr', 'ts');

const versionSelector: (commit) => { version: number } = (commit) => {
  let version;
  try {
    version = parseInt(commit?.v, 10);
  } catch (e) {
    console.error(util.format('fail to parse redisCommit, %j', e));
    version = null;
  }
  return { version };
};

const eventsSelector: (commit) => { events: Record<string, unknown>[] } = (commit) => {
  let events;
  try {
    events = JSON.parse(commit?.evstr);
  } catch (e) {
    console.error(util.format('fail to parse redisCommit, %j', e));
    events = null;
  }
  return { events };
};

const tsSelector: (commit) => { ts: number } = (commit) => {
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

const entityIdSelector: (commit) => { entityId: string } = (commit) => ({ entityId: commit?.id });

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
 * // restored commit
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
export const restoreCommit: OutputSelector<any, any, any> = createSelector(
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
