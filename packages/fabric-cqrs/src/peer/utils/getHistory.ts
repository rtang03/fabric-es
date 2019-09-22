import { flatMap, values } from 'lodash';
import { Commit } from '../../types';

export const getHistory = (entities: Record<string, Commit>): any[] => {
  const result = [];
  values(entities).forEach(({ events }) =>
    events.forEach(event => result.push(event))
  );
  return result;
};

// export const getHistory = (
//   entities: Record<string, Commit>
// ): Array<Commit['events']> => flatMap(values(entities), ({ events }) => events);
