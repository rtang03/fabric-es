import { User, userCommandHandler } from '@espresso/common';
import { Commit } from '@espresso/fabric-cqrs';
import { Paginated } from '../../types';

export const resolvers = {
  Query: {
    me: () =>
      Promise.resolve({
        userId: 'ADMIN001',
        name: 'Admin',
        mergedUserIds: []
      }),
    getCommitsByUserId: async (
      _, { userId }, { dataSources: { userDataSource }}): Promise<Commit[] | { error: any }> =>
      userDataSource.repo.getCommitById(userId)
        .then(({ data }) => data || [])
        .catch(error => ({ error })),
    getPaginatedUser: async (
      _, { cursor = 10 }, { dataSources: { userDataSource }}): Promise<Paginated<User> | { error: any }> =>
      userDataSource.repo.getByEntityName()
        .then(
          ({ data }: { data: any[] }) =>
            ({
              entities: data || [],
              hasMore: data.length > cursor,
              total: data.length
            } as Paginated<User>)
        )
        .catch(error => ({ error })),
    getUserById: async (
      _, { userId }, { dataSources: { userDataSource }}): Promise<User | { error: any }> =>
      userDataSource.repo.getById({ userId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    createUser: async (
      _, { name, userId }, { dataSources: { userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      userCommandHandler({
        enrollmentId,
        userRepo: userDataSource.repo
      }).CreateUser({
        userId,
        payload: { name, timestamp: Date.now() }
      }),
  }
};
