/**
 * @packageDocumentation
 * @hidden
 */
import { flatMap, values } from 'lodash';
import { Commit } from '../../types';

export const getHistory = (entities: Record<string, Commit>) =>
  flatMap(values(entities) as any, ({ events }) => events);
