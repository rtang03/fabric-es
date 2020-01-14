import { Commit } from '@espresso/fabric-cqrs';
import { ApolloError, AuthenticationError } from 'apollo-server-errors';
import Client from 'fabric-client';
import util from 'util';
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
    ): Promise<Commit[]> => {
      const logger = Client.getLogger('user-resolvers.js');

      return user.repo
        .getCommitById(userId)
        .then(({ data }) => data || [])
        .catch(({ error }) => {
          logger.warn(util.format('getCommitsByUserId error: %j', error));
          return error;
        });
    },
    getPaginatedUser: async (
      _,
      { cursor = 10 },
      { dataSources: { user } }: { dataSources: { user: UserDS } }
    ): Promise<Paginated<User>> => {
      const logger = Client.getLogger('user-resolvers.js');

      return user.repo
        .getByEntityName()
        .then(
          ({ data }: { data: any[] }) =>
            ({
              entities: data || [],
              hasMore: data.length > cursor,
              total: data.length
            } as Paginated<User>)
        )
        .catch(({ error }) => {
          logger.warn(util.format('getPaginatedUser error: %j', error));
          return error;
        });
    },
    getUserById: async (
      _,
      { userId },
      {
        dataSources: { user },
        enrollmentId
      }: { dataSources: { user: UserDS }; enrollmentId: string }
    ): Promise<User> => {
      const logger = Client.getLogger('user-resolvers.js');

      return user.repo
        .getById({ id: userId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => {
          logger.warn(util.format('getUserById error: %j', error));
          return error;
        });
    }
  },
  Mutation: {
    createUser: async (
      _,
      { name, userId },
      {
        dataSources: { user },
        enrollmentId
      }: { dataSources: { user: UserDS }; enrollmentId: string }
    ): Promise<Commit | ApolloError> => {
      const logger = Client.getLogger('user-resolvers.js');

      if (!enrollmentId) {
        logger.warn(`createUser error: ${NOT_AUTHENICATED}`);
        return new AuthenticationError(NOT_AUTHENICATED);
      }

      return userCommandHandler({
        enrollmentId,
        userRepo: user.repo
      })
        .CreateUser({
          userId,
          payload: { name, timestamp: Date.now() }
        })
        .catch(({ error }) => {
          logger.warn(util.format('createUser error: %j', error));
          return error;
        });
    }
  },
  UserResponse: {
    __resolveType: (obj: any) =>
      obj.commitId ? 'UserCommit' : obj.message ? 'UserError' : null
  }
};
