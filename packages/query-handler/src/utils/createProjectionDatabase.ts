import { ProjectionDatabase } from '../types';

export const createProjectionDatabase: (option: { entityName: string; database: any }) => ProjectionDatabase = ({
  entityName,
  database
}) => {
  return {
    find: ({ all, contain, where }) => null,
    upsert: ({ commit, reducer }) => null,
    upsertMany: ({ commits, reducer }) => null
  };
};
