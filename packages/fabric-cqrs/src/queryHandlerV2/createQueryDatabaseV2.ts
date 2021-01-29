import util from 'util';
import flatten from 'lodash/flatten';
import type { Commit } from '../types';
import { getLogger, isCommit } from '../utils';
import { INVALID_ARG } from './constants';
import type { QueryDatabaseV2, RedisRepository } from './types';

/**
 * @about create query database
 * @params redisearch client
 * @returns [[QueryDatabase]]
 */
export const createQueryDatabaseV2: (
  repos: Record<string, RedisRepository>,
  option?: { debug: boolean }
) => QueryDatabaseV2 = (repos, { debug } = { debug: false }) => {
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
    mergeCommit: async ({ commit }) => {
      // merge one commit
      if (!isCommit(commit)) throw new Error(INVALID_ARG);
      debug && logger.debug(util.format('%s - commit: %j', INVALID_ARG, commit));

      try {
        const key = repos['commit'].getKey(commit);
        const status = await repos['commit'].hmset(commit);
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
  };
};
