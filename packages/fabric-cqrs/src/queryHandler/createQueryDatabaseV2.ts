import util from 'util';
import flatten from 'lodash/flatten';
import { Redisearch } from 'redis-modules-sdk';
import type { Commit, QueryDatabase } from '../types';
import { getLogger, isCommit } from '../utils';
import { INVALID_ARG } from './constants';
import { getCommitHashFields, getCommitKey } from './createCIndex';

/**
 * @about create query database
 * @params redisearch client
 * @returns [[QueryDatabase]]
 */
export const createQueryDatabaseV2: (
  client: Redisearch,
  option?: { debug: boolean }
) => QueryDatabase = (client, { debug } = { debug: false }) => {
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
      if (!isCommit(commit)) throw new Error(INVALID_ARG);
      debug && logger.debug(util.format('%s - commit: %j', INVALID_ARG, commit));

      const key = getCommitKey(commit);
      debug && logger.debug(`getCommitKey returns: ${key}`);

      const value = getCommitHashFields(commit);
      debug && logger.debug(`getCommitHashFields returns: ${value}`);

      try {
        // see https://redis.io/commands/hmset
        const status = await client.redis.hmset(key, value);
        const result = {
          status,
          message: `${key} merged successfully`,
          result: [key],
        };
        debug && logger.debug(util.format('returns: %j', result));

        return result;
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
