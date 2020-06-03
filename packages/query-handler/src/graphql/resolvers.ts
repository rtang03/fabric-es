import { Commit } from '@fabric-es/fabric-cqrs';

export const resolvers = {
  Query: {
    queryByEntityName: async (_, { entityName, entityId }, context): Promise<Commit[]> => {
      return [
        {
          id: '',
          entityName: '',
          commitId: '',
          version: 0,
          entityId: '',
          events: []
        }
      ];
    }
  }
};
