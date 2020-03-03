import util from 'util';
import { Commit } from '@espresso/fabric-cqrs';
import { Paginated } from '@espresso/gw-node';
import { ApolloError } from 'apollo-server-errors';
import Client from 'fabric-client';
import gql from 'graphql-tag';
import { User, userCommandHandler, UserDS } from '.';

export const typeDefs = gql`
  type Query {
    getCommitsByUserId(userId: String!): [UserCommit]!
    getPaginatedUser(cursor: Int = 10): PaginatedUsers!
    getUserById(userId: String!): User
    me: User
  }

  type Mutation {
    createUser(name: String!, userId: String!): UserResponse
  }

  type User @key(fields: "userId") {
    userId: String!
    name: String!
    mergedUserIds: [String!]
  }

  type PaginatedUsers {
    entities: [User!]!
    total: Int!
    hasMore: Boolean!
    otherInfo: [String!]!
  }

  union UserResponse = UserCommit | UserError

  type UserEvent {
    type: String
  }

  type UserCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
    events: [UserEvent!]
  }

  type UserError {
    message: String!
    stack: String
  }
`;

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
      { dataSources: { user }, enrollmentId }: { dataSources: { user: UserDS }; enrollmentId: string }
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
      { dataSources: { user }, enrollmentId }: { dataSources: { user: UserDS }; enrollmentId: string }
    ): Promise<Commit | ApolloError> => {
      const logger = Client.getLogger('user-resolvers.js');

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
    __resolveType: (obj: any) => (obj.commitId ? 'UserCommit' : obj.message ? 'UserError' : null)
  }
};
