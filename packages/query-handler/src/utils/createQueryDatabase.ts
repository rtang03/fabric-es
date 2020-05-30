import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import type { Redis } from 'ioredis';
import assign from 'lodash/assign';
import filter from 'lodash/filter';
import flatten from 'lodash/flatten';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import keys from 'lodash/keys';
import values from 'lodash/values';
import type { QueryDatabase } from '../types';
import { getLogger } from './getLogger';
import {
  doFullTextSearch,
  fromArraysToCommitRecords,
  fullTextSearchAdd,
  fullTextSearchAddEntity,
  pipelineExecute,
} from '.';

export const createQueryDatabase: (redis: Redis) => QueryDatabase = (redis) => {
  const logger = getLogger({ name: '[query-handler] createQueryDatabase.js' });
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
    deleteCommitByEntityId: async ({ entityName, id }) => {
      const pattern = `${entityName}::${id}::*`;
      let result: number;

      try {
        const redisResult = await pipelineExecute(redis, 'DEL', pattern);
        result = countNonNull(redisResult);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
      return {
        status: 'OK',
        message: `${entityName}::${id}: ${result} records are removed`,
        result,
      };
    },
    deleteCommitByEntityName: async ({ entityName }) => {
      const pattern = `${entityName}::*`;
      let result: number;

      try {
        const redisResult = await pipelineExecute(redis, 'DEL', pattern);
        result = countNonNull(redisResult);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
      return {
        status: 'OK',
        message: `${entityName}: ${result} is removed`,
        result,
      };
    },
    queryCommitByEntityId: async ({ entityName, id }) => {
      const pattern = `${entityName}::${id}::*`;
      let commitArrays: string[][];
      let result: Record<string, Commit>;

      try {
        commitArrays = await pipelineExecute(redis, 'GET', pattern);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      if (commitArrays.length === 0)
        return { status: 'OK', message: `queryByEntityId: 0 record is returned`, result: {} };

      try {
        result = fromArraysToCommitRecords(commitArrays);
      } catch (e) {
        logger.error(util.format('fail to parse json, %j', e));
        throw e;
      }

      return {
        status: 'OK',
        message: `${Object.keys(result).length} records are returned`,
        result,
      };
    },
    queryCommitByEntityName: async ({ entityName }) => {
      const pattern = `${entityName}::*`;
      let commitArrays: string[][];
      let result: Record<string, Commit>;

      try {
        commitArrays = await pipelineExecute(redis, 'GET', pattern);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      try {
        result = fromArraysToCommitRecords(commitArrays);
      } catch (e) {
        logger.error(util.format('fail to parse json, %j', e));
        throw e;
      }
      return {
        status: 'OK',
        message: `${Object.keys(result).length} records are returned`,
        result,
      };
    },
    mergeCommit: async ({ commit }) => {
      const redisKey = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
      let status;

      try {
        status = await redis.set(redisKey, JSON.stringify(commit));

        // secondary index
        await fullTextSearchAdd(redisKey, commit, redis);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
      return { status, message: `${redisKey} merged successfully`, result: [redisKey] };
    },
    mergeCommitBatch: async ({ entityName, commits }) => {
      const map: Record<string, string> = {};
      const entityNameKeys = [];
      let status;

      if (isEqual(commits, {}))
        return {
          status: 'OK',
          message: 'no commit record exists',
          result: [],
        };

      try {
        for await (const [commitId, commit] of Object.entries(commits)) {
          // construct primary key-value map
          const redisKey = `${entityName}::${commit.entityId}::${commitId}`;
          map[redisKey] = JSON.stringify(commit);
          entityNameKeys.push(redisKey);

          // secondary index
          await fullTextSearchAdd(redisKey, commit, redis);
        }
        status = await redis.mset(map);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      logger.info(`entityName: ${entityName} mergBatch: ${status}`);

      return {
        status,
        message: `${entityNameKeys.length} records merged successfully`,
        result: entityNameKeys,
      };
    },
    mergeEntity: async <TEntity>({ commit, reducer }) => {
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
    mergeEntityBatch: async <TEntity>({ entityName, commits, reducer }) => {
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
    fullTextSearchCommit: async <TEntity>({ query }) =>
      doFullTextSearch<TEntity>(query, { redis, logger, index: 'cidx' }),
    fullTextSearchEntity: async <TEntity>({ query }) =>
      doFullTextSearch<TEntity>(query, { redis, logger, index: 'eidx' }),
  };
};
