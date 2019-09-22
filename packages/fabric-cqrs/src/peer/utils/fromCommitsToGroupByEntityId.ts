import { values } from 'lodash';
import { Commit, Reducer } from '../../types';

export const fromCommitsToGroupByEntityId: <T>(
  commits: Record<string, Commit>,
  reducer: Reducer
) => T[] = <T>(commits, reducer) =>
  values(
    values<Commit>(commits).reduce((commit, { entityId, events }) => {
      commit[entityId] = commit[entityId] || [];
      events.forEach(item => commit[entityId].push(item));
      return commit;
    }, {})
  ).map<T>((events: any) => reducer(events));
