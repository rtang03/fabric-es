import type { Redis } from 'ioredis';
import type { QueryDatabase } from '../types';

export const createQueryDatabase: (redis: Redis) => QueryDatabase = (redis) => {
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
    mergeBatch: ({ entityName, commits }) => null,
  };
};
