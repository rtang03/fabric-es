import util from 'util';
import { Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';
import { Commit, trackingReducer } from '../types';
import { getLogger, isCommit } from '../utils';
import { INVALID_ARG, REDIS_ERR, REDUCE_ERR } from './constants';
import { createRedisRepository } from './createRedisRepository';
import { commitSearchDefinition, postSelector, preSelector } from './model';
import { pipelineExec } from './pipelineExec';
import type { CommitInRedis, OutputCommit, QueryDatabaseV2, RedisRepository } from './types';

/**
 * @about create query database
 * @params redisearch client
 * @returns [[QueryDatabase]]
 */
export const createQueryDatabaseV2: (
  client: Redisearch,
  repos: Record<string, RedisRepository<any>>,
  option?: { debug?: boolean; notifyExpiryBySec?: number }
) => QueryDatabaseV2 = (
  client,
  repos,
  { debug, notifyExpiryBySec } = { debug: false, notifyExpiryBySec: 86400 }
) => {
  const logger = getLogger({ name: '[query-handler] createQueryDatabase.js', target: 'console' });

  const commitRepo = createRedisRepository<Commit, CommitInRedis, OutputCommit>({
    client,
    kind: 'commit',
    fields: commitSearchDefinition,
    preSelector,
    postSelector,
    entityName: 'commit',
  });

  // add built-in commit repo
  const allRepos = Object.assign({}, repos, { commit: commitRepo });

  // restore commit history from Redis format, and detect any errors
  // const parseCommitHistory: <T extends CommitInRedis, K extends OutputCommit>(
  //   data: [Error, T][],
  //   restoreFn: Selector<T, K>
  // ) => [boolean, K[]] = (data, restoreFn) => {
  //   const isError = data.map(([err, _]) => err).reduce((pre, cur) => pre || !!cur, false);
  //   const result = data.map(([_, item]) => item).map((item) => restoreFn(item));
  //   return [isError, result];
  // };

  const getHistory = (commits: (Commit | OutputCommit)[]): any[] => {
    const history = [];
    commits.forEach(({ events }) => events.forEach((item) => history.push(item)));
    return history;
  };

  return {
    getRedisCommitRepo: () => commitRepo,
    queryCommitByEntityId: async ({ entityName, id }) => {
      if (!entityName || !id) throw new Error(INVALID_ARG);

      return null;
    },
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
        logger.error(util.format('%s, %j', REDIS_ERR, e));
        throw e;
      }
    },
    mergeEntity: async <TEntity, TEntityInRedis>({ commit, reducer }) => {
      const { entityName, entityId, commitId } = commit;
      const entityRepo = allRepos[entityName];
      const entityKeyInRedis = allRepos[entityName].getKey(commit);
      const commitKeyInRedis = allRepos['commit'].getKey(commit);

      if (!entityRepo) throw new Error('entity repo not found');
      if (!isCommit(commit) || !reducer) throw new Error(INVALID_ARG);

      // step 1: retrieve existing commit
      const pattern = commitRepo.getPattern('COMMITS_BY_ENTITYNAME_ENTITYID', [
        entityName,
        entityId,
      ]);

      const [isError, restoredCommits] = await commitRepo.queryCommitsByPattern(pattern);

      if (isError)
        return {
          status: 'ERROR',
          message: 'fail to retrieve existing commit',
        };

      debug && logger.debug('restored commits, %j', restoredCommits);

      // step 2: merge existing record with newly retrieved commit
      const history: (Commit | OutputCommit)[] = [...restoredCommits, commit];

      // step 3: compute the timeline of event history
      const state = reducer(getHistory(history));
      /* e.g. newly computed state =
      {
        id: 'qh_proj_test_001',
        desc: 'query handler #2 proj',
        tag: 'projection',
        value: 2,
        _ts: 1590739000,
        _created: 1590738792,
        _creator: 'org1-admin'
      }
      */

      // step 4 add Tracking Info
      // TODO: need Paul's help about how to represent tracking information in Redis
      // const newComputedState = Object.assign({}, state, trackingReducer(history));

      debug && logger.debug(util.format('entity being merged, %j', state));

      // step 5: compute events history, returning comma separator
      if (!state?.id) {
        return {
          status: 'ERROR',
          message: REDUCE_ERR,
          error: new Error(`fail to reduce, ${entityName}:${entityId}:${commitId}`),
        };
      }

      const result = [];
      try {
        let status;
        // step 6: add entity
        status = await allRepos[entityName].hmset(state, history);
        result.push({ key: entityKeyInRedis, status });

        // step 7: add commit
        status = await allRepos['commit'].hmset(commit);
        result.push({ key: commitKeyInRedis, status });

        // step 8: add notification flag
        const notifyKey = `n:${state._created}:${entityName}:${entityId}:${commitId}`;
        await client.redis.set(notifyKey, 1, 'EX', notifyExpiryBySec);
      } catch (e) {
        // TODO: clarify what it means.
        if (!e.message.startsWith('[lifecycle]')) logger.error(util.format('%s, %j', REDIS_ERR, e));
        throw e;
      }

      return { status: 'OK', message: `${entityKeyInRedis} merged successfully`, result };
    },
  };
};
