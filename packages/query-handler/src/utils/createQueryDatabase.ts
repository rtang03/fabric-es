import util from 'util';
import type { Redis } from 'ioredis';
import type { QueryDatabase, QueryDatabaseResponse } from '../types';
import { getLogger } from './getLogger';

export const createQueryDatabase: (redis: Redis) => QueryDatabase = (redis) => {
  const logger = getLogger({ name: '[query-handler] QueryDatabase.js' });

  return {
    deleteByEntityId: async ({ entityName, id }) => {
      const result = await redis.del(id);
      return { status: '' };
    },
    deleteByEntityName: ({ entityName }) => null,
    queryByEntityId: async ({ entityName, id }) => {
      return await redis.get(id).then((result) => JSON.parse(result));
    },
    queryByEntityName: ({ entityName }) => null,
    merge: async ({ commit }) => {
      const key = commit.commitId;
      await redis.set(key, JSON.stringify(commit));
      return null;
    },
    mergeBatch: async ({ entityName, commits }) => {
      const map: Record<string, string> = {};

      Object.entries(commits).forEach(
        ([key, value]) => (map[`${entityName}::${value.entityId}::${key}`] = JSON.stringify(value))
      );

      let response: QueryDatabaseResponse;
      let result;

      try {
        result = await redis.mset(map);
        response =
          result === 'OK'
            ? { status: 'SUCCESS', message: 'mergeBath success', result }
            : { status: 'ERROR', message: 'mergeBatch error', result };
      } catch (e) {
        logger.error(util.format('unknown redis error, %j', e));
        throw new Error(e);
      }

      logger.info(`entityName: ${entityName} mergBatch: ${result}`);
      return response;
    },
  };
};
