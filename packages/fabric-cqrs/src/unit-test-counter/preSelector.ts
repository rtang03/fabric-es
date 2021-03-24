import flatten from 'lodash/flatten';
import { createStructuredSelector, Selector } from 'reselect';
import type { Commit } from '../types';
import type { Counter, CounterInRedis } from './types';

/**
 * @see counterSearchDefinition.ts
 * @ignore
 * @input example [[Counter]]
 * ```typescript
 * {
 *   id: 'qh_proj_test_001',
 *   desc: 'query handler #2 proj',
 *   tag: 'projection',
 *   value: 2,
 *   _ts: 1590739000,
 *   _created: 1590738792,
 *   _creator: 'org1-admin'
 * }
 * ```
 * @output example [[CounterInRedis]]
 * ```text
 * # redis-cli returns
 * 127.0.0.1:6379> FT.SEARCH eidx:test_proj *
 * 1) "id"
 * 2) "qh_proj_test_001"
 * 3) "tag"
 * 4) "projection"
 * 5) "de"
 * 6) "query handler #2 proj"
 * 7) "val"
 * 8) "2"
 * 9) "ts"
 * 10) "1590739000"
 * 11) "created"
 * 12) "1590738792"
 * 13) "creator"
 * 14) "org1-admin"
 * 15) "event"
 * 16) "Increment,Increment"
 * ```
 */
export const preSelector: Selector<[Counter, Commit[]], CounterInRedis> = createStructuredSelector({
  // created: ([{ _created }]) => _created,
  // creator: ([{ _creator }]) => _creator,
  de: ([{ desc }]) => desc,
  event: ([_, history]) =>
    flatten(history.map(({ events }) => events))
      .map(({ type }) => type)
      .reduce((prev, curr) => (prev ? `${prev},${curr}` : curr), null),
  history: ([_, history]) =>
    history
      .map(({ commitId, entityId, entityName }) => `c:${entityName}:${entityId}:${commitId}`)
      .reduce((prev, curr) => (prev ? `${prev},${curr}` : curr), null),
  id: ([{ id }]) => id,
  tag: ([{ tag }]) => tag,
  tl: ([_, history]) =>
    flatten(history.map(({ events }) => events))
      .map(({ payload }) => payload._ts)
      .reduce((prev, curr) => (prev ? `${prev},${curr}` : curr), null),
  // ts: ([{ _ts }]) => _ts,
  val: ([{ value }]) => value,
  // organ: ([{ _organization }]) => JSON.stringify(_organization),
});
