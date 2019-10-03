import { Context, ResourceRepo } from './types';

export const getResourceRepo: (context: Context) => ResourceRepo = context => ({
  upsert: async (resource: any) => null,
  findByKey: async (key: string) =>
    Promise.resolve({ key: 'user123', userId: 'user123' }),
  removeOne: async (key: string) => null
});
