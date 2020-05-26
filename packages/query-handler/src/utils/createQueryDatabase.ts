import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import type { Redis } from 'ioredis';
import flatten from 'lodash/flatten';
import isEqual from 'lodash/isEqual';
import type { QueryDatabase } from '../types';
import { getLogger } from './getLogger';

export const createQueryDatabase: (redis: Redis) => QueryDatabase = (redis) => {
  const logger = getLogger({ name: '[query-handler] QueryDatabase.js' });
  const fromArraysToCommitRecords: (commitArrays: string[][]) => Record<string, Commit> = (commitArrays) => {
    const result: any = {};
    flatten(commitArrays)
      .filter((item) => !!item)
      .forEach((item) => {
        const commit = JSON.parse(item);
        result[commit.commitId] = commit;
      });
    return result;
  };
  const countNonNull = (deletedItems: number[][]) =>
    flatten(deletedItems)
      .filter((item) => !!item)
      .reduce((prev, curr) => prev + curr, 0);
  const pipelineExecute = async (action: 'GET' | 'DEL', pattern: string) => {
    const keys = await redis.keys(pattern);
    const sortedKeys = keys.sort();
    const pipeline = redis.pipeline();
    if (action === 'GET') sortedKeys.forEach((key) => pipeline.get(key));
    if (action === 'DEL') keys.forEach((key) => pipeline.del(key));
    return await pipeline.exec();
  };

  return {
    deleteByEntityId: async ({ entityName, id }) => {
      const pattern = `${entityName}::${id}::*`;
      let result: number;

      try {
        const redisResult = await pipelineExecute('DEL', pattern);
        result = countNonNull(redisResult);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw new Error(e);
      }
      return {
        status: 'OK',
        message: `query_deleteByEntityId for ${entityName}::${id}: ${result} records are removed`,
        result,
      };
    },
    deleteByEntityName: async ({ entityName }) => {
      const pattern = `${entityName}::*`;
      let result: number;

      try {
        const redisResult = await pipelineExecute('DEL', pattern);
        result = countNonNull(redisResult);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw new Error(e);
      }
      return {
        status: 'OK',
        message: `query_deleteByEntityName for ${entityName}: ${result} is removed`,
        result,
      };
    },
    queryByEntityId: async ({ entityName, id }) => {
      const pattern = `${entityName}::${id}::*`;
      let commitArrays: string[][];
      let result: Record<string, Commit>;

      try {
        commitArrays = await pipelineExecute('GET', pattern);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw new Error(e);
      }

      if (commitArrays.length === 0)
        return { status: 'OK', message: `queryByEntityId: 0 record is returned`, result: {} };

      try {
        result = fromArraysToCommitRecords(commitArrays);
      } catch (e) {
        logger.error(util.format('fail to parse json, %j', e));
        throw new Error(e);
      }

      return { status: 'OK', message: `queryByEntityId: ${Object.keys(result).length} records are returned`, result };
    },
    queryByEntityName: async ({ entityName }) => {
      const pattern = `${entityName}::*`;
      let commitArrays: string[][];
      let result: Record<string, Commit>;

      try {
        commitArrays = await pipelineExecute('GET', pattern);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw new Error(e);
      }

      try {
        result = fromArraysToCommitRecords(commitArrays);
      } catch (e) {
        logger.error(util.format('fail to parse json, %j', e));
        throw new Error(e);
      }
      return { status: 'OK', message: 'queryByEntityName', result };
    },
    merge: async ({ entityName, commit }) => {
      const redisKey = `${entityName}::${commit.entityId}::${commit.commitId}`;

      let status;

      try {
        status = await redis.set(redisKey, JSON.stringify(commit));
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw new Error(e);
      }
      return { status, message: `${redisKey} merged successfully`, result: [redisKey] };
    },
    mergeBatch: async ({ entityName, commits }) => {
      const map: Record<string, string> = {};
      const entityNameKeys = [];
      let status;

      if (isEqual(commits, {}))
        return {
          status: 'OK',
          message: 'no commit record exists',
          result: [],
        };

      Object.entries(commits).forEach(([commitId, commit]) => {
        const redisKey = `${entityName}::${commit.entityId}::${commitId}`;
        map[redisKey] = JSON.stringify(commit);
        entityNameKeys.push(redisKey);
      });

      try {
        status = await redis.mset(map);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw new Error(e);
      }

      logger.info(`entityName: ${entityName} mergBatch: ${status}`);

      return {
        status,
        message: `${entityNameKeys.length} records merged successfully`,
        result: entityNameKeys,
      };
    },
  };
};
