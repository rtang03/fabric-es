import trimStart from 'lodash/trimStart';
import { createStructuredSelector, Selector } from 'reselect';
import type { Commit } from '../../types';
import type { CommitInRedis } from '../types';

/**
 * @about Below commit fields will be saved in Redis. Field, like 'hash' and 'eventstring'
 * is not implemented; are reserved for future use. Also, some commit fields may be belonging
 * to Private data, will neither be saved in Redis.
 */
export type PickedCommit = Required<
  Pick<Commit, 'id' | 'entityName' | 'commitId' | 'mspId' | 'entityId' | 'events' | 'version'>
  >;

/**
 * @about from [[PickedCommit]] to [[CommitInRedis]]
 * @input example [[PickedCommit]]
 * ```typescript
 * {
 *    id: 'qh_proj_test_001',
 *    entityName: 'test_proj',
 *    version: 0,
 *    commitId: '20200528133519841',
 *    entityId: 'qh_proj_test_001',
 *    mspId: 'Org1MSP',
 *    events: [ { type: 'Increment', payload: [Object] } ]
 *  }
 * ```
 * @output example [[CommitInRedis]]
 * ```text
 * # redis-cli returns
 * 127.0.0.1:6379> FT.SEARCH cidx qh*
 * 2) "c:test_proj:qh_proj_test_001:20200528133519841"
 * 3)  1) "entityName"
 * 2) "test_proj"
 * 3) "id"
 * 4) "qh_proj_test_001"
 * 5) "event"
 * 6) "Increment"
 * 7) "mspId"
 * 8) "Org1MSP"
 * 9) "creator"
 * 10) "org1-admin"
 * 11) "entityId"
 * 12) "qh_proj_test_001"
 * 13) "evstr"
 * 14) "[{\"type\":\"Increment\",\"payload\":{\"id\":\"qh_proj_test_001\",\"desc\":\"query handler #1 proj\",\"tag\":\"projection\",\"_ts\":1590738792,\"_created\":1590738792,\"_creator\":\"org1-admin\"}}]"
 * 15) "commitId"
 * 16) "20200528133519841"
 * 17) "ts"
 * 18) "1590738792"
 * 19) "v"
 * 20) "0"
 * ```
 */
export const preSelector: Selector<[PickedCommit], CommitInRedis> = createStructuredSelector({
  id: ([{ id }]) => id,
  entityName: ([{ entityName }]) => entityName,
  commitId: ([{ commitId }]) => commitId,
  mspId: ([{ mspId }]) => mspId,
  entityId: ([{ entityId }]) => entityId,
  creator: ([{ events }]) => events[0]?.payload?._creator,
  event: ([{ events }]) =>
    trimStart(
      events.reduce((pre, { type }) => `${pre},${type}`, ''),
      ','
    ),
  evstr: ([{ events }]) => JSON.stringify(events),
  ts: ([{ events }]) => (events[0]?.payload?._ts || 0).toString(),
  v: ([{ version }]) => version.toString(),
});
