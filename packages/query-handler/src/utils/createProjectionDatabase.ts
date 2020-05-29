import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import type { Redis } from 'ioredis';
import assign from 'lodash/assign';
import filter from 'lodash/filter';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import keys from 'lodash/keys';
import values from 'lodash/values';
import { ProjectionDatabase } from '../types';
import {
  fromArraysToCommitRecords,
  fullTextSearchAdd,
  fullTextSearchAddEntity,
  getLogger,
  pipelineExecute,
} from '.';

export const createProjectionDatabase: (redis: Redis) => ProjectionDatabase = (redis) => {
  const logger = getLogger({ name: '[query-handler] createProjectionDatabase.js' });
  const getHistory = (commits: Commit[]): any[] => {
    const history = [];
    commits.forEach(({ events }) => events.forEach((item) => history.push(item)));
    return history;
  };

  return {
    merge: async <TEntity>({ commit, reducer }) => {
      let status;
      let redisKey: string;

      try {
        const commitsInRedis = await pipelineExecute(
          redis,
          'GET',
          `${commit.entityName}::${commit.id}::*`
        );
        const commitToMerge = { [commit.commitId]: commit };
        const mergedResult = isEqual(commitsInRedis, [])
          ? commitToMerge
          : assign({}, fromArraysToCommitRecords(commitsInRedis), commitToMerge);
        const currentState: TEntity = reducer(getHistory(values(mergedResult)));
        redisKey = `${commit.entityName}::${commit.entityId}`;
        status = await redis.set(redisKey, JSON.stringify(currentState));

        // secondary index
        await fullTextSearchAddEntity<TEntity>(redisKey, currentState, redis);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      return {
        status: 'OK',
        message: `${redisKey} merged successfully`,
        result: [{ key: redisKey, status }],
      };
    },
    mergeBatch: async <TEntity>({ entityName, commits, reducer }) => {
      const result = [];
      if (isEqual(commits, {}))
        return {
          status: 'OK',
          message: 'no commit record exists',
          result: [],
        };

      const filterCommits = filter(commits, (item) => entityName === item.entityName);
      const group: Record<string, Commit[]> = groupBy(filterCommits, ({ id }) => id);
      const entities = [];
      keys(group).forEach((id) => {
        entities.push(assign({ id }, reducer(getHistory(values(group[id])))));
      });

      try {
        for await (const entity of entities) {
          const redisKey = `${entityName}::${entity.id}`;
          const status = await redis.set(redisKey, JSON.stringify(entity));
          result.push({ key: redisKey, status });

          // secondary index
          await fullTextSearchAddEntity<TEntity>(redisKey, entity, redis);
        }
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      return { status: 'OK', message: `${result.length} entitie(s) are merged`, result };
    },
    fullTextSearch: async ({ query }) => {

    },
  };
};
