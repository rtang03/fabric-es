import util from 'util';
import type { Redis } from 'ioredis';
import assign from 'lodash/assign';
import filter from 'lodash/filter';
import flatten from 'lodash/flatten';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import keys from 'lodash/keys';
import values from 'lodash/values';
import { Commit, QueryDatabase, trackingReducer } from '../types';
import { isCommit, getLogger } from '../utils';
import {
  arraysToCommitRecords,
  fullTextSearchAddCommit,
  fullTextSearchAddEntity,
  doFullTextSearch,
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
      if (!entityName || !id) throw new Error('invalid input argument');

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
      if (!entityName) throw new Error('invalid input argument');

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
        message: `entityName ${entityName}: ${result} record(s) is removed`,
        result,
      };
    },
    queryCommitByEntityId: async ({ entityName, id }) => {
      if (!entityName || !id) throw new Error('invalid input argument');

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
        result = arraysToCommitRecords(commitArrays);
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
      if (!entityName) throw new Error('invalid input argument');

      const pattern = `${entityName}::*::*`;
      let commitArrays: string[][];
      let result: Record<string, Commit>;

      try {
        commitArrays = await pipelineExecute(redis, 'GET', pattern);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      try {
        result = arraysToCommitRecords(commitArrays);
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
      if (!isCommit(commit)) throw new Error('invalid input argument');

      const redisKey = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
      let status;

      try {
        status = await redis.set(redisKey, JSON.stringify(commit));

        // secondary index
        await fullTextSearchAddCommit(redisKey, commit, redis);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
      return { status, message: `${redisKey} merged successfully`, result: [redisKey] };
    },
    mergeCommitBatch: async ({ entityName, commits }) => {
      if (!entityName || !commits) throw new Error('invalid input argument');

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
          await fullTextSearchAddCommit(redisKey, commit, redis);
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
      if (!isCommit(commit) || !reducer) throw new Error('invalid input argument');

      let statusCommit;
      let statusEntity;
      let statusCIdx;
      let statusEIdx;
      let redisKeyCommit: string;
      let redisKeyEntity: string;

      try {
        const commitsInRedis = await pipelineExecute(
          redis,
          'GET',
          `${commit.entityName}::${commit.id}::*`
        );
        const commitToMerge = { [commit.commitId]: commit };

        const mergedResult = isEqual(commitsInRedis, [])
          ? commitToMerge
          : assign({}, arraysToCommitRecords(commitsInRedis), commitToMerge);

        const currentState = reducer(getHistory(values(mergedResult)));
        if (currentState) Object.assign(currentState, trackingReducer(values(mergedResult)));

        if (!currentState?.id) {
          return {
            status: 'ERROR',
            message: 'fail to reduce to currentState',
            error: new Error(
              `fail to reduce, entityName: ${commit.entityName} entityId: ${commit.id}, commitid: ${commit.commitId}`
            ),
          };
        }

        redisKeyEntity = `${commit.entityName}::${commit.entityId}`;

        // (1) add newly computed entity
        statusEntity = await redis.set(redisKeyEntity, JSON.stringify(currentState));

        // (2) add new commit
        redisKeyCommit = `${commit.entityName}::${commit.entityId}::${commit.commitId}`;
        statusCommit = await redis.set(redisKeyCommit, JSON.stringify(commit));

        // (3) add to secondary index: eidx
        statusEIdx = await fullTextSearchAddEntity<TEntity>(redisKeyEntity, currentState, redis);

        // (4) add to secondary index: cidx
        statusCIdx = await fullTextSearchAddCommit(redisKeyCommit, commit, redis);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }
      return {
        status: 'OK',
        message: `${redisKeyEntity} merged successfully`,
        result: [
          { key: redisKeyEntity, status: statusEntity },
          { key: redisKeyCommit, status: statusCommit },
          { key: `eidx::${redisKeyEntity}`, status: statusEIdx },
          { key: `cidx::${redisKeyCommit}`, status: statusCIdx },
        ],
      };
    },
    mergeEntityBatch: async <TEntity>({ entityName, commits, reducer }) => {
      if (!entityName || !commits || !reducer) throw new Error('invalid input argument');

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
      const error = [];

      keys(group).forEach((id) => {
        const reduced = reducer(getHistory(values(group[id])));
        if (reduced?.id)
          entities.push(assign({ id }, reduced, trackingReducer(values(group[id]))));
        else
          error.push({ id });
      });

      try {
        for await (const entity of entities) {
          // (1) add entity
          const redisKey = `${entityName}::${entity.id}`;
          const status = await redis.set(redisKey, JSON.stringify(entity));
          result.push({ key: redisKey, status });

          // (2) secondary index
          await fullTextSearchAddEntity<TEntity>(redisKey, entity, redis);
        }
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      return {
        status: error.length === 0 ? 'OK' : 'ERROR',
        message: `${result.length} entitie(s) are merged`,
        result,
        error: error.length === 0 ? null : error,
      };
    },
    fullTextSearchCommit: async <TEntity>({ query }) => {
      if (!query) throw new Error('invalid input argument');

      return doFullTextSearch<TEntity>(query, { redis, logger, index: 'cidx' });
    },
    fullTextSearchEntity: async <TEntity>({ query }) => {
      if (!query) throw new Error('invalid input argument');

      return doFullTextSearch<TEntity>(query, { redis, logger, index: 'eidx' });
    },
    queryEntity: async ({ entityName, where }) => {
      let entityArrays: string[][];
      let entities: any[];
      const result: Record<string, any> = {};

      try {
        entityArrays = await pipelineExecute(redis, 'GET_ENTITY_ONLY', `${entityName}::*`);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw e;
      }

      if (entityArrays.length === 0)
        return {
          status: 'OK',
          message: 'no record exists',
          result: null,
        };

      try {
        entities = flatten(entityArrays)
          .filter((item) => !!item)
          .map((item) => JSON.parse(item));
      } catch (e) {
        logger.error(util.format('fail to parse entity, %e', e));
        throw e;
      }

      filter(entities, where).forEach((entity) => (result[entity.id] = entity));

      return {
        status: 'OK',
        message: `${keys(result).length} record(s) returned`,
        result: isEqual(result, {}) ? null : result,
      };
    },
  };
};
