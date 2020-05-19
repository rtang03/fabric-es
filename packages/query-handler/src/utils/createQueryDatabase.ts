import { Redis } from 'ioredis';
import { QueryDatabase } from '../types';

export const createQueryDatabase: (database: Redis) => QueryDatabase = () => {
  return {
    deleteByEntityId: ({ entityName, id }) => null,
    deleteByEntityName: ({ entityName }) => null,
    queryByEntityId: ({ entityName, id }) => null,
    queryByEntityName: ({ entityName }) => null,
    merge: ({ commit }) => null,
    mergeBatch: ({ entityName, commits }) => null
  };
};
