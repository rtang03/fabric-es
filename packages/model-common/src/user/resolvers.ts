import { Commit } from '@espresso/fabric-cqrs';
import { AuthenticationError } from 'apollo-server-errors';
import { User, userCommandHandler, UserDS } from '.';
import { Paginated } from '..';

const NOT_AUTHENICATED = 'no enrollment id';

export const resolvers = {
  Query: {
    me: () =>
      Promise.resolve({
        userId: 'ADMIN001',
        name: 'Admin',
        mergedUserIds: []
      }),
    getCommitsByUserId: async (
      _,
      { userId },
      { dataSources: { user } }: { dataSources: { user: UserDS } }
    ): Promise<Commit[]> =>
      user.repo
        .getCommitById(userId)
        .then(({ data }) => data || [])
        .catch(({ error }) => error),
    getPaginatedUser: async (
      _,
      { cursor = 10 },
      { dataSources: { user } }: { dataSources: { user: UserDS } }
    ): Promise<Paginated<User>> =>
      user.repo
        .getByEntityName()
        .then(
          ({ data }: { data: any[] }) =>
            ({
              entities: data || [],
              hasMore: data.length > cursor,
              total: data.length
            } as Paginated<User>)
        )
        .catch(({ error }) => error),
    getUserById: async (
      _,
      { userId },
      {
        dataSources: { user },
        enrollmentId
      }: { dataSources: { user: UserDS }; enrollmentId: string }
    ): Promise<User> =>
      user.repo
        .getById({ id: userId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => error)
  },
  Mutation: {
    createUser: async (
      _,
      { name, userId },
      {
        dataSources: { user },
        enrollmentId
      }: { dataSources: { user: UserDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : userCommandHandler({
            enrollmentId,
            userRepo: user.repo
          })
            .CreateUser({
              userId,
              payload: { name, timestamp: Date.now() }
            })
            .catch(({ error }) => error)
  },
  UserResponse: {
    __resolveType: (obj: any) =>
      obj.commitId ? 'UserCommit' : obj.message ? 'UserError' : null
  }
};
