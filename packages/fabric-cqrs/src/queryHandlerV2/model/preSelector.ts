import pick from 'lodash/pick';
import trimStart from 'lodash/trimStart';
import { createSelector, OutputSelector } from 'reselect';
import type { Commit } from '../../types';
import type { CommitInRedis } from '../types';

/**
 * @about Below commit fields will be saved in Redis. Field, like 'hash' and 'eventstring'
 * is not implemented; are reserved for future use. Also, some commit fields may be belonging
 * to Private data, will neither be saved in Redis.
 */
type PickedCommit = Required<
  Pick<Commit, 'id' | 'entityName' | 'commitId' | 'mspId' | 'entityId' | 'events' | 'version'>
>;

/**
 * @about from [[PickedCommit]] to [[CommitInRedis]]
 */
export const preSelector: OutputSelector<PickedCommit, CommitInRedis, any> = createSelector(
  (commit) => pick(commit, 'id', 'entityName', 'commitId', 'mspId', 'entityId'),
  ({ events }): string => events[0]?.payload?._creator,
  ({ events }): string =>
    trimStart(
      events.reduce((pre, { type }) => `${pre},${type}`, ''),
      ','
    ),
  ({ events }): string => JSON.stringify(events),
  ({ events }): string => (events[0]?.payload?._ts || 0).toString(),
  ({ version }): string => version.toString(),
  (base, creator, event, evstr, ts, v) => ({
    ...base,
    ...{ creator },
    ...{ event },
    ...{ evstr },
    ...{ ts },
    ...{ v },
  })
);
