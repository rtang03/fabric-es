import util from 'util';
import { Redisearch } from 'redis-modules-sdk';
import type { OutputSelector } from 'reselect';
import type { Commit } from '../types';
import { getLogger, isCommit } from '../utils';
import { INVALID_ARG } from './constants';
import { createRedisRepository } from './createRedisRepository';
import { commitSearchDefinition, outputCommit as selector } from './model';
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
  option?: { debug: boolean }
) => QueryDatabaseV2 = (client, repos, { debug } = { debug: false }) => {
  const logger = getLogger({ name: '[query-handler] createQueryDatabase.js', target: 'console' });

  const commitRepo = createRedisRepository<Commit, CommitInRedis, OutputCommit>({
    client,
    kind: 'commit',
    fields: commitSearchDefinition,
    selector,
  });

  const allRepos = Object.assign({}, repos, { commit: commitRepo });

  const parseData: <T extends CommitInRedis, K extends OutputCommit>(
    data: [Error, T][],
    restoreFn: OutputSelector<any, any, any>
  ) => [boolean, K[]] = (data, restoreFn) => {
    const isError = data.map(([err, _]) => err).reduce((pre, cur) => pre || !!cur, false);
    const result = data.map(([_, item]) => item).map((item) => restoreFn(item));
    return [isError, result];
  };

  const getHistory = (commits: (Commit | OutputCommit)[]): any[] => {
    const history = [];
    commits.forEach(({ events }) => events.forEach((item) => history.push(item)));
    return history;
  };

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
    mergeEntity: async <TEntity, TEntityInRedis>({ commit, reducer }) => {
      if (!isCommit(commit) || !reducer) throw new Error(INVALID_ARG);
      const restore: OutputSelector<CommitInRedis, OutputCommit, any> = commitRepo.getSelector();
      const pattern = commitRepo.getPattern('COMMITS_BY_ENTITYNAME_ENTITYID', [
        commit?.entityName,
        commit?.entityId,
      ]);

      // step 1: retrieve existing commit
      let isRetrievingError = false;
      let reselectedCommits: OutputCommit[];
      try {
        [isRetrievingError, reselectedCommits] = await pipelineExec<CommitInRedis>(
          client,
          'GET_ALL',
          pattern
        ).then((result) => parseData(result, restore));
      } catch (error) {
        logger.error(util.format('fail to retrieve existing commit, %j', error));
        isRetrievingError = true;
      }

      if (isRetrievingError)
        return {
          status: 'ERROR',
          message: 'fail to retrieve existing commit',
        };

      // step 2: merge existing record with newly retrieved commit
      const merged: (Commit | OutputCommit)[] = [...reselectedCommits, commit];

      // step 3: compute the timeline of event history
      const newState = reducer(getHistory(merged));
      /* newState =
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

      // // step 3: compute events history, returning comma separator
      // const _event: string = flatten(merged.map<BaseEvent[]>(({ events }) => events))
      //   .map(({ type }) => type)
      //   .reduce((prev, curr) => (prev ? `${prev},${curr}` : curr), null);

      return null;
    },
  };
};
