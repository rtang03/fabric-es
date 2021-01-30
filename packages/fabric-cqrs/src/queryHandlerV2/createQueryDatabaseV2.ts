import util from 'util';
import { Redisearch } from 'redis-modules-sdk';
import type { Commit } from '../types';
import { getLogger, isCommit } from '../utils';
import { INVALID_ARG } from './constants';
import { createRedisRepository } from './createRedisRepository';
import { commitMapFields, restoreCommit } from './model';
import type { CommitInRedis, ReselectedCommit, QueryDatabaseV2, RedisRepository } from './types';

/**
 * @about create query database
 * @params redisearch client
 * @returns [[QueryDatabase]]
 */
export const createQueryDatabaseV2: (
  client: Redisearch,
  repos: Record<string, RedisRepository<any>>,
  option?: { debug: boolean }
) => QueryDatabaseV2 = (client, repos, { debug } = { debug: false }) => {
  const logger = getLogger({ name: '[query-handler] createQueryDatabase.js', target: 'console' });
  const commitRepo = createRedisRepository<Commit, CommitInRedis, ReselectedCommit>({
    client,
    kind: 'commit',
    fields: commitMapFields,
    restore: restoreCommit,
  });

  const allRepos = Object.assign({}, repos, { commit: commitRepo });

  return {
    getRedisCommitRepo: () => commitRepo,
    mergeCommit: async ({ commit }) => {
      // merge one commit
      if (!isCommit(commit)) throw new Error(INVALID_ARG);
      debug && logger.debug(util.format('%s - commit: %j', INVALID_ARG, commit));

      try {
        const key = allRepos['commit'].getKey(commit);
        const status = await allRepos['commit'].hmset(commit);
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
