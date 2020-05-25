import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import type { Redis } from 'ioredis';
import flatten from 'lodash/flatten';
import type { QueryDatabase, QueryDatabaseResponse } from '../types';
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
  const multiRedisGet = async (pattern) => {
    const keys = await redis.keys(pattern);
    const pipeline = redis.pipeline();
    keys.forEach((key) => pipeline.get(key));
    return await pipeline.exec();
  };

  return {
    deleteByEntityId: async ({ entityName, id }) => {
      const pattern = `${entityName}::${id}::*`;
      let response: QueryDatabaseResponse;
      let status;

      const result = await redis.keys(pattern);
      return { status: '', message: '' };
    },
    deleteByEntityName: async ({ entityName }) => {
      let result;
      try {
        // (1) delete entityName
        const indexedKeys: string[] = await redis.smembers(`set::${entityName}`);
        const pipeline = redis.pipeline();
        indexedKeys.forEach((key) => pipeline.del(key));
        result = await pipeline.exec();

        // (2) remove index - entityName
        await redis.del(`set::${entityName}`);
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw new Error(e);
      }
      return { status: 'OK', message: `query_deleteByEntityName: ${entityName} is removed`, result };
    },
    queryByEntityId: async ({ entityName, id }) => {
      const pattern = `${entityName}::${id}::*`;
      let commitArrays: string[][];
      let result: Record<string, Commit>;

      try {
        commitArrays = await multiRedisGet(pattern);
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

      return { status: 'OK', message: 'queryByEntityId', result };
    },
    queryByEntityName: async ({ entityName }) => {
      const pattern = `${entityName}::*`;
      let commitArrays: string[][];
      let result: Record<string, Commit>;

      try {
        commitArrays = await multiRedisGet(pattern);
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

      let response: QueryDatabaseResponse;
      let status;

      try {
        // (1) add commit
        status = await redis.set(redisKey, JSON.stringify(commit));

        // (2) add index - entityName
        await redis.sadd(`set::${entityName}`, redisKey);

        response = { status, message: `${redisKey} merged successfully`, result: [redisKey] };
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw new Error(e);
      }
      return response;
    },
    mergeBatch: async ({ entityName, commits }) => {
      const map: Record<string, string> = {};
      const entityNameKeys = [];
      let status;

      Object.entries(commits).forEach(([commitId, commit]) => {
        const redisKey = `${entityName}::${commit.entityId}::${commitId}`;
        map[redisKey] = JSON.stringify(commit);
        entityNameKeys.push(redisKey);
      });

      try {
        // (1) add commits. mset always return "OK", mset cannot fail
        status = await redis.mset(map);

        // (2) add index - entityName
        const pipeline = redis.pipeline();
        pipeline.del(`set::${entityName}`);
        entityNameKeys.forEach((key) => pipeline.sadd(`set::${entityName}`, key));
        await pipeline.exec();
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
