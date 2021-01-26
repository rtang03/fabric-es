import flatten from 'lodash/flatten';
import { Redisearch } from 'redis-modules-sdk';
import type { Commit, QueryDatabase } from '../types';
import { getLogger, isCommit } from '../utils';
import { getCommitHashFields, getCommitKey } from './createCIndex';
import util from 'util';

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
    mergeCommit: async ({ commit }) => {
      // merge one commit
      if (!isCommit(commit)) throw new Error('invalid input argument');

      const key = getCommitKey(commit);
      const value = getCommitHashFields(commit);

      try {
        const status = await client.redis.hmset(key, value);

        return {
          status,
          message: `${key} merged successfully`,
          result: [key],
        };
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
    },
    mergeCommitBatch: null,
    mergeEntity: null,
    mergeEntityBatch: null,
    queryCommitByEntityId: null,
    queryCommitByEntityName: null,
    queryEntity: null,
  };
};
