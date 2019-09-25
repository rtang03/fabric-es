import { flatMap, values } from 'lodash';
import { Commit } from '../../types';

export const getHistory = (
  entities: Record<string, Commit>
): Array<Commit['events']> => flatMap(values(entities), ({ events }) => events);
