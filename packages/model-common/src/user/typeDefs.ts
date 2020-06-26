import { Commit } from '@fabric-es/fabric-cqrs';
import { catchErrors, getLogger, Paginated } from '@fabric-es/gateway-lib';
import gql from 'graphql-tag';
import { User, userCommandHandler, UserDS } from '.';

export const typeDefs = gql`
  type Query {
    getCommitsByUserId(userId: String!): [UserCommit]!
    getPaginatedUser(cursor: Int = 10): PaginatedUsers!
    getUserById(userId: String!): User
    searchUserByFields(where: String!): [User]
    searchUserContains(contains: String!): [User]
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
    mspId: String
    entityId: String
    events: [UserEvent!]
  }

  type UserError {
    message: String!
    stack: String
  }
`;

const logger = getLogger('user/typeDefs.js');

type Context = { dataSources: { user: UserDS }; username; string };

export const resolvers = {
  Query: {
    me: () =>
      Promise.resolve({
        userId: 'ADMIN001',
        name: 'Admin',
        mergedUserIds: [],
      }),
    getCommitsByUserId: catchErrors(
      async (_, { userId }, { dataSources: { user } }: Context): Promise<Commit[]> =>
        user.repo.getCommitById(userId).then(({ data }) => data || []),
      { fcnName: 'getCommitsByUserId', logger, useAuth: false }
    ),
    getPaginatedUser: catchErrors(
      async (_, { cursor = 10 }, { dataSources: { user } }: Context): Promise<Paginated<User>> =>
        user.repo.getByEntityName().then(
          ({ data }: { data: any[] }) =>
            ({
              entities: data || [],
              hasMore: data.length > cursor,
              total: data.length,
            } as Paginated<User>)
        ),
      { fcnName: 'getPaginatedUser', logger, useAuth: false }
    ),
    getUserById: catchErrors(
      async (_, { userId }, { dataSources: { user }, username }: Context): Promise<User> =>
        user.repo
          .getById({ id: userId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'getUserById', logger, useAuth: true }
    ),
    // TODO: where is limited to { id: "entityid" }. Cannot search other than entityId
    searchUserByFields: catchErrors(
      async (_, { id }, { dataSources: { user }, username }: Context): Promise<User[]> =>
        user.repo.find({ byId: id }).then(({ data }) => Object.values(data)),
      { fcnName: 'searchUserByFields', logger, useAuth: false }
    ),
    searchUserContains: catchErrors(
      async (_, { contains }, { dataSources: { user }, username }: Context): Promise<User[]> =>
        user.repo.find({ byDesc: contains }).then(({ data }) => Object.values(data)),
      { fcnName: 'searchUserContains', logger, useAuth: false }
    ),
  },
  Mutation: {
    createUser: catchErrors(
      async (_, { name, userId }, { dataSources: { user }, username }: Context): Promise<Commit> =>
        userCommandHandler({
          enrollmentId: username,
          userRepo: user.repo,
        }).CreateUser({
          userId,
          payload: { name, timestamp: Date.now() },
        }),
      { fcnName: 'createUser', logger, useAuth: false }
    ),
  },
  UserResponse: {
    __resolveType: (obj: any) => (obj.commitId ? 'UserCommit' : obj.message ? 'UserError' : null),
  },
};
