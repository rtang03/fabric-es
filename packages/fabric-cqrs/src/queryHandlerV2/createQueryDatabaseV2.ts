import util from 'util';
import filter from 'lodash/filter';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import { Redisearch } from 'redis-modules-sdk';
import { Commit, trackingReducer } from '../types';
import { getLogger, isCommit } from '../utils';
import { INVALID_ARG, NO_RECORDS, QUERY_ERR, REDIS_ERR, REDUCE_ERR } from './constants';
import { commitSearchDefinition, postSelector, preSelector } from './model';
import type { CommitInRedis, OutputCommit, QueryDatabaseV2, RedisRepository } from './types';
import { createRedisRepository } from '.';

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

  const getHistory = (commits: (Commit | OutputCommit)[]): any[] => {
    const history = [];
    commits.forEach(({ events }) => events.forEach((event) => history.push(event)));
    return history;
  };

  const deleteCommit = async (pattern: string) => {
    const [error, count] = await commitRepo.deleteCommitsByPattern(pattern);
    return error
      ? {
          status: 'ERROR',
          message: 'some delete fails',
          error,
        }
      : {
          status: 'OK',
          message: `${count} record(s) deleted`,
          result: count,
        };
  };

  return {
    deleteCommitByEntityId: async ({ entityName, id }) => {
      if (!entityName || !id) throw new Error(INVALID_ARG);

      return deleteCommit(
        commitRepo.getPattern('COMMITS_BY_ENTITYNAME_ENTITYID', [entityName, id])
      );
    },
    deleteCommitByEntityName: async ({ entityName }) => {
      if (!entityName) throw new Error(INVALID_ARG);

      return deleteCommit(commitRepo.getPattern('COMMITS_BY_ENTITYNAME', [entityName]));
    },
    getRedisCommitRepo: () => commitRepo,
    queryCommitByEntityId: async ({ entityName, id }) => {
      if (!entityName || !id) throw new Error(INVALID_ARG);

      const pattern = commitRepo.getPattern('COMMITS_BY_ENTITYNAME_ENTITYID', [entityName, id]);
      const [error, result] = await commitRepo.queryCommitsByPattern(pattern);

      return error
        ? { status: 'ERROR', message: QUERY_ERR, error }
        : { status: 'OK', message: `${result.length} record(s) returned`, result };
    },
    queryCommitByEntityName: async ({ entityName }) => {
      if (!entityName) throw new Error(INVALID_ARG);

      const pattern = commitRepo.getPattern('COMMITS_BY_ENTITYNAME', [entityName]);
      const [error, result] = await commitRepo.queryCommitsByPattern(pattern);

      return error
        ? { status: 'ERROR', message: QUERY_ERR, error }
        : { status: 'OK', message: `${result.length} record(s) returned`, result };
    },
    mergeCommit: async ({ commit }) => {
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

        debug && logger.debug(util.format('result returns: %j', result));

        return result;
      } catch (e) {
        logger.error(util.format('%s, %j', REDIS_ERR, e));
        throw e;
      }
    },
    mergeCommitBatch: async ({ entityName, commits }) => {
      if (!entityName || !commits) throw new Error(INVALID_ARG);
      if (isEqual(commits, {}))
        return {
          status: 'OK',
          message: NO_RECORDS,
          result: [],
        };

      const result = [];
      const error = [];
      try {
        for await (const commit of Object.values(commits)) {
          const status = await allRepos['commit'].hmset(commit);
          const key = allRepos['commit'].getKey(commit);
          if (status === 'OK') result.push(key);
          else error.push(key);
        }
      } catch (e) {
        logger.error(util.format('%s, %j', REDIS_ERR, e));
        throw e;
      }
      debug && logger.debug(util.format('result returns: %j', result));
      debug && logger.debug(util.format('error returns: %j', error));

      return {
        status: error.length === 0 ? 'OK' : 'ERROR',
        message: `${result.length} record(s) merged successfully`,
        result,
        error,
      };
    },
    mergeEntity: async ({ commit, reducer }) => {
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

      debug && logger.debug('restored commits, %j', restoredCommits);

      if (isError)
        return {
          status: 'ERROR',
          message: 'fail to retrieve existing commit',
        };

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

      debug && logger.debug(util.format('result returns: %j', result));

      return { status: 'OK', message: `${entityKeyInRedis} merged successfully`, result };
    },
    mergeEntityBatch: async ({ entityName, commits, reducer }) => {
      if (!entityName || !commits || !reducer) throw new Error(INVALID_ARG);
      if (isEqual(commits, {}))
        return {
          status: 'OK',
          message: NO_RECORDS,
          result: [],
        };

      // safety filter: ensure only relevant entityName is processed
      const filteredCommits = filter(commits, { entityName });
      const groupByEntityId: Record<string, Commit[]> = groupBy(filteredCommits, ({ id }) => id);
      const errors = [];
      const entities = Object.entries(groupByEntityId)
        .map(([entityId, commits]) => {
          const state = reducer(getHistory(commits));
          const keyOfEntityInRedis = allRepos[entityName].getKey(commits[0]);
          // if reducer fails
          !state && errors.push(entityId);
          return { state, commits, key: keyOfEntityInRedis };
        })
        .filter(({ state }) => !!state); // ensure no null; if error happens when reducing

      debug && logger.debug(util.format('errors found, %j', errors));

      // add entity. Notice that the original orginal commit is not saved.
      const result = [];
      for await (const { state, commits, key } of entities) {
        try {
          const status = await allRepos[entityName].hmset(state, commits);
          result.push({ key, status });
        } catch (e) {
          logger.error(util.format('%s, %j', REDIS_ERR, e));
          throw e;
        }
      }

      debug && logger.debug(util.format('result returns: %j', result));

      return {
        status: errors.length === 0 ? 'OK' : 'ERROR',
        message: `${result.length} record(s) merged`,
        result,
        error: errors.length === 0 ? null : errors,
      };
    },
  };
};
