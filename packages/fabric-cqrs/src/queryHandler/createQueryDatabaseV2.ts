import flatten from 'lodash/flatten';
import { Redisearch } from 'redis-modules-sdk';
import type { Commit, QueryDatabase } from '../types';
import { getLogger } from '../utils';

/**
 * @about Create query database
 * @params redis
 * @returns [[QueryDatabase]]
 */
export const createQueryDatabaseV2: (client: Redisearch) => QueryDatabase = (client) => {
  const logger = getLogger({ name: '[query-handler] createQueryDatabase.js', target: 'console' });
  const countNonNull = (deletedItems: number[][]) =>
    flatten(deletedItems)
      .filter((item) => !!item)
      .reduce((prev, curr) => prev + curr, 0);
  const getHistory = (commits: Commit[]): any[] => {
    const history = [];
    commits.forEach(({ events }) => events.forEach((item) => history.push(item)));
    return history;
  };

  return {
    clearNotification: null,
    deleteCommitByEntityId: null,
    deleteCommitByEntityName: null,
    getNotification: null,
    fullTextSearchCommit: null,
    fullTextSearchEntity: null,
    mergeCommit: null,
    mergeCommitBatch: null,
    mergeEntity: null,
    mergeEntityBatch: null,
    queryCommitByEntityId: null,
    queryCommitByEntityName: null,
    queryEntity: null,
  };
};
