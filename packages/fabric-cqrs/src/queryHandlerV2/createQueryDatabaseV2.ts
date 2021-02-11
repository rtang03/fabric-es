import util from 'util';
import filter from 'lodash/filter';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import { FTSearchParameters, Redisearch } from 'redis-modules-sdk';
import { Commit, HandlerResponse, trackingReducer } from '../types';
import { getLogger, isCommit } from '../utils';
import {
  INVALID_ARG,
  NO_RECORDS,
  QUERY_ERR,
  REDIS_ERR,
  REDUCE_ERR,
  REPO_NOT_FOUND,
} from './constants';
import { commitSearchDefinition, postSelector, preSelector } from './model';
import type { CommitInRedis, OutputCommit, QueryDatabaseV2, RedisRepository } from './types';
import { createNotificationCenter, createRedisRepository } from '.';

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

  const notificationCenter = createNotificationCenter(client);

  // add built-in commit repo
  const allRepos = Object.assign({}, repos, { commit: commitRepo });

  const getHistory = (commits: (Commit | OutputCommit)[]): any[] => {
    const history = [];
    commits.forEach(({ events }) => events.forEach((event) => history.push(event)));
    return history;
  };

  const deleteItems = async <TItem>(repo: RedisRepository<TItem>, pattern: string) => {
    const [errors, count] = await repo.deleteItemsByPattern(pattern);
    const isError = errors?.reduce((pre, cur) => pre || !!cur, false);

    return isError
      ? {
          status: 'ERROR' as any,
          message: `${count} record(s) deleted`,
          errors,
        }
      : {
          status: 'OK' as any,
          message: `${count} record(s) deleted`,
          data: count,
        };
  };

  const queryCommit = async (pattern, args) => {
    const [errors, data] = await commitRepo.queryCommitsByPattern(
      commitRepo.getPattern(pattern, args)
    );
    const isError = errors?.reduce((pre, cur) => pre || !!cur, false);

    debug && console.debug(util.format('returns data, %j', data));
    debug && console.debug(util.format('returns error, %j', errors));

    return isError
      ? { status: 'ERROR' as any, message: QUERY_ERR, errors }
      : { status: 'OK' as any, message: `${data.length} record(s) returned`, data };
  };

  const doSearch: <T>(option: {
    repo: RedisRepository<T>;
    kind: 'commit' | 'entity';
    query: string;
    param: FTSearchParameters;
    countTotalOnly: boolean;
  }) => Promise<HandlerResponse> = async ({ repo, kind, query, param, countTotalOnly }) => {
    const { search, getIndexName } = repo;
    const index = getIndexName();
    const [errors, count, data] = await search({
      countTotalOnly,
      kind,
      index,
      query,
      param,
      restoreFn: kind === 'entity' && repo.getPostSelector(),
    });
    const isError = errors?.reduce((pre, cur) => pre || !!cur, false);

    debug && console.debug(util.format('returns data, %j', data));
    debug && console.debug(util.format('returns error, %j', errors));

    return isError
      ? { status: 'ERROR', message: 'search error', errors }
      : {
          status: 'OK',
          message: `${count} record(s) returned`,
          data: countTotalOnly ? count : data,
        };
  };

  return {
    clearNotification: async (option) => notificationCenter.clearNotification(option),
    clearNotifications: async (option) => notificationCenter.clearNotifications(option),
    deleteCommitByEntityId: async ({ entityName, id }) => {
      if (!entityName || !id) throw new Error(INVALID_ARG);

      return deleteItems(
        commitRepo,
        commitRepo.getPattern('COMMITS_BY_ENTITYNAME_ENTITYID', [entityName, id])
      );
    },
    deleteCommitByEntityName: async ({ entityName }) => {
      if (!entityName) throw new Error(INVALID_ARG);

      return deleteItems(commitRepo, commitRepo.getPattern('COMMITS_BY_ENTITYNAME', [entityName]));
    },
    deleteEntityByEntityName: async <TEntity>({ entityName }) => {
      if (!entityName) throw new Error(INVALID_ARG);
      const entityRepo = allRepos[entityName];

      if (!entityRepo) throw new Error(REPO_NOT_FOUND);

      return deleteItems<TEntity>(
        entityRepo,
        entityRepo.getPattern('ENTITIES_BY_ENTITYNAME', [entityName])
      );
    },
    fullTextSearchCommit: async ({ query, param, countTotalOnly }) => {
      if (!query) throw new Error(INVALID_ARG);

      return doSearch<OutputCommit>({
        repo: commitRepo,
        countTotalOnly,
        kind: 'commit',
        query,
        param,
      });
    },
    fullTextSearchEntity: async <TEntity>({ entityName, query, param, countTotalOnly }) => {
      if (!query || !entityName) throw new Error(INVALID_ARG);

      const repo = allRepos[entityName];
      if (!repo) throw new Error(REPO_NOT_FOUND);

      return doSearch<TEntity>({ repo, countTotalOnly, kind: 'entity', query, param });
    },
    getNotification: async ({ creator, entityName, id, commitId }) =>
      notificationCenter.getNotification({ creator, entityName, id, commitId }),
    getNotificationsByFields: async ({ creator, entityName, id }) =>
      notificationCenter.getNotificationsByFields({ creator, entityName, id }),
    getRedisCommitRepo: () => commitRepo,
    queryCommitByEntityId: async ({ entityName, id }) => {
      if (!entityName || !id) throw new Error(INVALID_ARG);

      return queryCommit('COMMITS_BY_ENTITYNAME_ENTITYID', [entityName, id]);
    },
    queryCommitByEntityName: async ({ entityName }) => {
      if (!entityName) throw new Error(INVALID_ARG);

      return queryCommit('COMMITS_BY_ENTITYNAME', [entityName]);
    },
    mergeCommit: async ({ commit }) => {
      if (!isCommit(commit)) throw new Error(INVALID_ARG);

      try {
        const key = allRepos['commit'].getKey(commit);
        const status = await allRepos['commit'].hmset(commit);
        return {
          status,
          message: `${key} merged successfully`,
          data: [key],
        };
      } catch (e) {
        logger.error(util.format('mergeCommit - %s, %j', REDIS_ERR, e));
        throw e;
      }
    },
    mergeCommitBatch: async ({ entityName, commits }) => {
      if (!entityName || !commits) throw new Error(INVALID_ARG);
      if (isEqual(commits, {}))
        return {
          status: 'OK',
          message: NO_RECORDS,
          data: [],
        };

      const data = [];
      const error = [];
      try {
        for await (const commit of Object.values(commits)) {
          const status = await allRepos['commit'].hmset(commit);
          const key = allRepos['commit'].getKey(commit);
          if (status === 'OK') data.push(key);
          else error.push(key);
        }
      } catch (e) {
        logger.error(util.format('mergeCommitBatch - %s, %j', REDIS_ERR, e));
        throw e;
      }
      debug && console.debug(util.format('data returns: %j', data));
      debug && console.debug(util.format('error returns: %j', error));

      return {
        status: error.length === 0 ? 'OK' : 'ERROR',
        message: `${data.length} record(s) merged successfully`,
        data,
        error,
        errors: error,
      };
    },
    mergeEntity: async ({ commit, reducer }) => {
      const { entityName, entityId, commitId } = commit;
      const entityRepo = allRepos[entityName];
      const entityKeyInRedis = allRepos[entityName].getKey(commit);
      const commitKeyInRedis = allRepos['commit'].getKey(commit);

      if (!entityRepo) throw new Error(REPO_NOT_FOUND);
      if (!isCommit(commit) || !reducer) throw new Error(INVALID_ARG);

      // step 1: retrieve existing commit
      const pattern = commitRepo.getPattern('COMMITS_BY_ENTITYNAME_ENTITYID', [
        entityName,
        entityId,
      ]);

      const [errors, restoredCommits] = await commitRepo.queryCommitsByPattern(pattern);
      const isError = errors?.reduce((pre, cur) => pre || !!cur, false);

      debug && console.debug('restored commits, %j', restoredCommits);

      if (isError)
        return {
          status: 'ERROR',
          message: 'fail to retrieve existing commit',
          errors,
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

      debug && console.debug(util.format('entity being merged, %j', state));

      // step 5: compute events history, returning comma separator
      if (!state?.id) {
        return {
          status: 'ERROR',
          message: REDUCE_ERR,
          errors: [new Error(`fail to reduce, ${entityName}:${entityId}:${commitId}`)],
        };
      }

      const data = [];
      try {
        let status;
        // step 6: add entity
        status = await allRepos[entityName].hmset(state, history);
        data.push({ key: entityKeyInRedis, status });

        // step 7: add commit
        status = await allRepos['commit'].hmset(commit);
        data.push({ key: commitKeyInRedis, status });

        // step 8: add notification flag
        await notificationCenter.notify({
          creator: state._creator,
          entityName,
          id: entityId,
          commitId,
        });
      } catch (e) {
        if (!e.message.startsWith('[lifecycle]'))
          logger.error(util.format('mergeEntity - %s, %j', REDIS_ERR, e));
        throw e;
      }

      debug && console.debug(util.format('data returns: %j', data));

      return { status: 'OK', message: `${entityKeyInRedis} merged successfully`, data };
    },
    mergeEntityBatch: async ({ entityName, commits, reducer }) => {
      if (!entityName || !commits || !reducer) throw new Error(INVALID_ARG);

      const entityRepo = allRepos[entityName];
      if (!entityRepo) throw new Error(REPO_NOT_FOUND);

      if (isEqual(commits, {}))
        return {
          status: 'OK',
          message: NO_RECORDS,
          data: [],
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

      debug && console.debug(util.format('errors found, %j', errors));

      // add entity. Notice that the original orginal commit is not saved.
      const data = [];
      for await (const { state, commits, key } of entities) {
        try {
          const status = await allRepos[entityName].hmset(state, commits);
          data.push({ key, status });
        } catch (e) {
          logger.error(util.format('mergeEntityBatch - %s, %j', REDIS_ERR, e));
          throw e;
        }
      }

      debug && console.debug(util.format('data returns: %j', data));

      return {
        status: errors.length === 0 ? 'OK' : 'ERROR',
        message: `${data.length} record(s) merged`,
        data,
        errors: errors.length === 0 ? null : errors,
      };
    },
  };
};
