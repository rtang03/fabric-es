import type { Commit, Reducer } from '../types';

/**
 * compute the entity current state from commit, returning with groupBy entityId
 * @ignore
 */
export const commitsToGroupByEntityId: <TResult>(
  commits: Commit[],
  reducer: Reducer
) => { currentStates: TResult[]; errors: string[] } = <TResult>(commits, reducer) => {
  const groupedByEntityId: Record<string, any[]> = commits.reduce(
    (commit, { entityId, events }) => {
      commit[entityId] = commit[entityId] || [];
      events.forEach((item) => commit[entityId].push(item));

      return commit;
    },
    {}
  );

  const currentStates: TResult[] = [];
  const errors: string[] = [];

  Object.entries(groupedByEntityId).forEach(([entityId, events]) => {
    const currentState = reducer(events);
    if (currentState) currentStates.push(currentState);
    else errors.push(entityId);
  });

  return { currentStates, errors };
};
