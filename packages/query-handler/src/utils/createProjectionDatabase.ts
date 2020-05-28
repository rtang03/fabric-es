import type { Redis } from 'ioredis';
import { ProjectionDatabase } from '../types';
import { getLogger } from './getLogger';

export const createProjectionDatabase: (redis: Redis) => ProjectionDatabase = (redis) => {
  const logger = getLogger({ name: '[query-handler] createProjectionDatabase.js' });

  return {
    find: async ({ all, contain, where }) => {
      await redis.send_command('d');
      return null;
    },
    merge: ({ commit, reducer }) => null,
    mergeBatch: ({ commits, reducer }) => null,
  };
};
