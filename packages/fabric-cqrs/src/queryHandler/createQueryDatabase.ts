import util from 'util';
import Debug from 'debug';
import filter from 'lodash/filter';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import { FTSearchParameters, Redisearch } from 'redis-modules-sdk';
import { Commit, computeEntity, HandlerResponse } from '../types';
import { getLogger, isCommit } from '../utils';
import {
  FATAL,
  INVALID_ARG,
  NO_RECORDS,
  QUERY_ERR,
  REDIS_ERR,
  REDUCE_ERR,
  REPO_NOT_FOUND,
} from './constants';
import { commitSearchDefinition, postSelector, preSelector } from './model';
import type { CommitInRedis, OutputCommit, QueryDatabase, RedisRepository } from './types';
import { createNotificationCenter, createRedisRepository } from '.';

/**
 * @about create query database
 * @example [subscribe.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/queryHandler/__tests__/subscribe.unit-test.ts)
 * @params client redisearch client
 * @params repos RedisRepositories
 * @returns [[QueryDatabase]]
 */
export const createQueryDatabase: (
  client: Redisearch,
  repos: Record<string, RedisRepository<any>>,
  option?: { notifyExpiryBySec?: number }
) => QueryDatabase = (client, repos, { notifyExpiryBySec } = { notifyExpiryBySec: 86400 }) => {
  const debug = Debug('queryHandler:createQueryDatabase');
  const logger = getLogger({ name: '[query-handler] createQueryDatabase.js', target: 'console' });
  const commitRepo = createRedisRepository<Commit, CommitInRedis, OutputCommit>('commit', {
    client,
    kind: 'commit',
    fields: commitSearchDefinition,
    preSelector,
    postSelector,
  });

  const notificationCenter = createNotificationCenter(client);

  // add built-in commit repo
  const allRepos = Object.assign(repos, { commit: commitRepo });

  // const getHistory = (commits: (Commit | OutputCommit)[]): any[] => {
  //   const history = [];
  //   commits.forEach(({ events }) => events.forEach((event) => history.push(event)));
  //   return history;
  // };

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
    debug('doSearch:kind, %s', kind);
    debug('doSearch:kind, %s', query);

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

    debug('doSearch:errors, %O', errors);

    const isError = errors?.reduce((pre, cur) => pre || !!cur, false);

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
      debug('deleteCommitByEntityId:id, %s', id);

      if (!entityName || !id) throw new Error(INVALID_ARG);

      return deleteItems(
        commitRepo,
        commitRepo.getPattern('COMMITS_BY_ENTITYNAME_ENTITYID', [entityName, id])
      );
    },
    deleteCommitByEntityName: async ({ entityName }) => {
      debug('deleteCommitByEntityName:entityName, %s', entityName);

      if (!entityName) throw new Error(INVALID_ARG);

      return deleteItems(commitRepo, commitRepo.getPattern('COMMITS_BY_ENTITYNAME', [entityName]));
    },
    deleteEntityByEntityName: async <TEntity>({ entityName }) => {
      debug('deleteEntityByEntityName:entityName, %s', entityName);

      if (!entityName) throw new Error(INVALID_ARG);

      const entityRepo = allRepos[entityName];

      if (!entityRepo) throw new Error(`deleteEntityByEntityName: ${entityName} ${REPO_NOT_FOUND}`);

      return deleteItems<TEntity>(
        entityRepo,
        entityRepo.getPattern('ENTITIES_BY_ENTITYNAME', [entityName])
      );
    },
    fullTextSearchCommit: async ({ query, param, countTotalOnly }) => {
      debug('fullTextSearchCommit:query, %s', query);
      debug('fullTextSearchCommit:param, %O', param);

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
      debug('fullTextSearchEntity:query, %s', query);
      debug('fullTextSearchEntity:param, %O', param);

      if (!query || !entityName) throw new Error(INVALID_ARG);

      const repo = allRepos[entityName];
      if (!repo)
        throw new Error(
          `fullTextSearchEntity: ${entityName} ${REPO_NOT_FOUND} -- ${Object.keys(allRepos)}`
        );

      return doSearch<TEntity>({ repo, countTotalOnly, kind: 'entity', query, param });
    },
    getNotification: async ({ creator, entityName, id, commitId }) =>
      notificationCenter.getNotification({ creator, entityName, id, commitId }),
    getNotificationsByFields: async ({ creator, entityName, id }) =>
      notificationCenter.getNotificationsByFields({ creator, entityName, id }),
    getRedisCommitRepo: () => commitRepo,
    queryCommitByEntityId: async ({ entityName, id }) => {
      debug('queryCommitByEntityId:id, %s', id);

      if (!entityName || !id) throw new Error(INVALID_ARG);

      return queryCommit('COMMITS_BY_ENTITYNAME_ENTITYID', [entityName, id]);
    },
    queryCommitByEntityName: async ({ entityName }) => {
      debug('queryCommitByEntityName:entityName, %s', entityName);

      if (!entityName) throw new Error(INVALID_ARG);

      return queryCommit('COMMITS_BY_ENTITYNAME', [entityName]);
    },
    mergeCommit: async ({ commit }) => {
      debug('mergeCommit:commit', commit);

      if (!isCommit(commit)) throw new Error(INVALID_ARG);

      try {
        const key = allRepos['commit'].getKey(commit);

        debug('mergeCommit:key, %s', key);

        const status = await allRepos['commit'].hmset(commit);

        debug('mergeCommit:status, %s', status);

        return {
          status,
          message: `${key} merged successfully`,
          data: [key],
        };
      } catch (e) {
        debug('mergeCommit:"try-catch-error"');
        debug('mergeCommit, %O', e);

        logger.error(util.format('mergeCommit - %s, %j', REDIS_ERR, e));
        throw e;
      }
    },
    mergeCommitBatch: async ({ entityName, commits }) => {
      debug('mergeCommitBatch starts');

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
        debug('mergeCommitBatch:"try-catch-error"');
        debug('mergeCommitBatch, %O', e);

        logger.error(util.format('mergeCommitBatch - %s, %j', REDIS_ERR, e));
        throw e;
      }

      debug('mergeCommitBatch:error, %O', error);

      return {
        status: error.length === 0 ? 'OK' : 'ERROR',
        message: `${data.length} record(s) merged successfully`,
        data,
        error,
        errors: error,
      };
    },
    mergeEntity: async ({ commit, reducer }) => {
      debug('mergeEntity:commit, %O', commit);

      const { entityName, entityId, commitId } = commit;
      const entityRepo = allRepos[entityName];
      const entityKeyInRedis = allRepos[entityName].getKey(commit);
      const commitKeyInRedis = allRepos['commit'].getKey(commit);

      debug('mergeEntity:entityKeyInRedis, %s', entityKeyInRedis);
      debug('mergeEntity:commitKeyInRedis, %s', commitKeyInRedis);

      if (!entityRepo) throw new Error(`${FATAL} mergeEntity: ${entityName} ${REPO_NOT_FOUND}`);

      if (!isCommit(commit) || !reducer) throw new Error(`${FATAL} ${INVALID_ARG}`);

      // step 1: retrieve existing commit
      debug('mergeEntity:step-1');

      const pattern = commitRepo.getPattern('COMMITS_BY_ENTITYNAME_ENTITYID', [
        entityName,
        entityId,
      ]);

      debug('pattern: %s', pattern);

      const [errors, restoredCommits] = await commitRepo.queryCommitsByPattern(pattern);
      const isError = errors?.reduce((pre, cur) => pre || !!cur, false);

      debug('restoredCommits: %O', restoredCommits);

      if (isError) {
        debug('mergeEntity:errors, %O', errors);

        logger.error(
          util.format('errors of "await commitRepo.queryCommitsByPattern(pattern)", %j', errors)
        );

        return {
          status: 'ERROR',
          message: `${FATAL} fail to retrieve existing commit`,
          errors,
        };
      }

      // step 2: merge existing record with newly retrieved commit
      debug('mergeEntity:step-2');

      const history: (Commit | OutputCommit)[] = [...restoredCommits, commit];

      // step 3: compute the timeline of event history, and add tracking info
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

      const { state, reduced } = computeEntity(history, reducer);

      debug('mergeEntity:history, %O', history);
      debug('mergeEntity:entity being merged, %O', state);

      // step 3: compute events history, returning comma separator
      // Here assumes that state is valid, only if "id" field exists.
      // NOTE: "fail to reduce" is FATAL_DATA_INTEGRITY_ERROR. MUST REVISIT
      if (reduced && !state?.id) {
        debug('mergeEntity:"fail to reduce"');

        logger.error(util.format('state, %j', state));

        return {
          status: 'ERROR',
          message: REDUCE_ERR,
          errors: [new Error(`${FATAL} fail to reduce, ${entityName}:${entityId}:${commitId}`)],
        };
      }

      const data = [];
      try {
        let status;
        // step 4: add entity
        debug('mergeEntity:step-4');

        if (reduced) {
          status = await allRepos[entityName].hmset(state, history);
          data.push({ key: entityKeyInRedis, status });
        }

        // step 5: add commit
        debug('mergeEntity:step-5');

        status = await allRepos['commit'].hmset(commit);
        data.push({ key: commitKeyInRedis, status });

        // step 6: add notification flag
        debug('mergeEntity:step-6');

        if (reduced) {
          await notificationCenter.notify({
            creator: state._creator,
            entityName,
            id: entityId,
            commitId,
          });
        }
        debug('mergeEntity:finish without error');
      } catch (e) {
        if (!e.message.startsWith('[lifecycle]'))
          logger.error(util.format('mergeEntity - %s, %j', REDIS_ERR, e));
        throw e;
      }

      debug('data returns: %O', data);

      return { status: 'OK', message: `${entityKeyInRedis} merged successfully`, data };
    },
    mergeEntityBatch: async ({ entityName, commits, reducer }) => {
      debug('mergeEntityBatch starts');
      if (!entityName || !commits || !reducer) throw new Error(INVALID_ARG);

      const entityRepo = allRepos[entityName];
      if (!entityRepo) throw new Error(`mergeEntityBatch: ${entityName} ${REPO_NOT_FOUND}`);

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
          const { state, reduced } = computeEntity(commits, reducer);
          const keyOfEntityInRedis = allRepos[entityName].getKey(commits[0]);
          // if reducer fails
          if (reduced && !state) errors.push(entityId);
          return { state, commits, key: keyOfEntityInRedis };
        })
        .filter(({ state }) => !!state); // ensure no null; if error happens when reducing

      debug('mergeEntityBatch:errors, %O', errors);

      // add entity. Notice that the original orginal commit is not saved.
      const data = [];
      for await (const { state, commits, key } of entities) {
        try {
          const status = await allRepos[entityName].hmset(state, commits);
          data.push({ key, status });
        } catch (e) {
          debug('mergeEntityBatch:e, %O', e);

          logger.error(util.format('mergeEntityBatch - %s, %j', REDIS_ERR, e));
          throw e;
        }
      }

      debug('mergeEntityBatch:data, %O', data);

      return {
        status: errors.length === 0 ? 'OK' : 'ERROR',
        message: `${data.length} record(s) merged`,
        data,
        errors: errors.length === 0 ? null : errors,
      };
    },
  };
};
