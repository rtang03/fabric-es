import { Commit } from '@fabric-es/fabric-cqrs';
import { catchErrors, getLogger, Paginated } from '../../..';
import { User, userCommandHandler, UserDS } from '.';

export const UserTypeDefsQuery = `
me: User
getCommitsByUserId(userId: String!): [UserCommit]!
getPaginatedUser(cursor: Int = 10): PaginatedUsers!
getUserById(userId: String!): User
searchUserByFields(where: String!): [User]
searchUserContains(contains: String!): [User]
`;

export const UserTypeDefsMutation = `
createUser(userId: String!, name: String!): UserResponse
deleteUser(userId: String!): UserResponse
updateUser(userId: String!, name: String!): UserResponse
endorseUser(userId: String!, endorsedId: String!): UserResponse
`;

export const UserTypeDefsType = `
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

type Context = { dataSources: { user: UserDS }; username: string; user_id: string; mspId: string };

export const resolvers = {
  Query: {
    me: catchErrors(
      async (__, _, { dataSources: { user }, user_id, username }: Context): Promise<User> =>
        user.repo.getById({ id: user_id, enrollmentId: username }).then(({ currentState }) => currentState),
      { fcnName: 'me', logger, useAuth: false }
    ),
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
              total: data.length
            } as Paginated<User>)
        ),
      { fcnName: 'getPaginatedUser', logger, useAuth: false }
    ),
    getUserById: catchErrors(
      async (_, { userId }, { dataSources: { user }, username }: Context): Promise<User> =>
        user.repo.getById({ id: userId, enrollmentId: username }).then(({ currentState }) => currentState),
      { fcnName: 'getUserById', logger, useAuth: true }
    ),
    searchUserByFields: catchErrors(
      async (_, { where }, { dataSources: { user }, username }: Context): Promise<User[]> =>
        user.repo.getProjection({ where: JSON.parse(where) }).then(({ data }) => data),
      { fcnName: 'searchUserByFields', logger, useAuth: false }
    ),
    searchUserContains: catchErrors(
      async (_, { contains }, { dataSources: { user }, username }: Context): Promise<User[]> =>
        user.repo.getProjection({ contain: contains }).then(({ data }) => data),
      { fcnName: 'searchUserContains', logger, useAuth: false }
    )
  },
  Mutation: {
    createUser: catchErrors(
      async (_, { userId, name }, { dataSources: { user }, username, mspId }: Context): Promise<Commit> =>
        userCommandHandler({
          enrollmentId: username,
          userRepo: user.repo
        }).CreateUser({
          userId,
          payload: { mspId, name, timestamp: Date.now() }
        }),
      { fcnName: 'createUser', logger, useAuth: true }
    ),
    deleteUser: catchErrors(
      async (_, { userId }, { dataSources: { user }, username }: Context): Promise<Commit> =>
        userCommandHandler({
          enrollmentId: username,
          userRepo: user.repo
        }).DeleteUser({
          userId, payload: { timestamp: Date.now() }
        }),
      { fcnName: 'deleteUser', logger, useAuth: true }
    ),
    updateUser: catchErrors(
      async (_, { userId, name }, { dataSources: { user }, username }: Context): Promise<Commit> =>
        userCommandHandler({
          enrollmentId: username,
          userRepo: user.repo
        }).DefineUserName({
          userId,
          payload: { name, timestamp: Date.now() }
        }),
      { fcnName: 'updateUser', logger, useAuth: true }
    ),
    endorseUser: catchErrors(
      async (_, { userId, endorsedId }, { dataSources: { user }, username }: Context): Promise<Commit> =>
        userCommandHandler({
          enrollmentId: username,
          userRepo: user.repo
        }).EndorseUser({
          userId,
          payload: { endorsedId, timestamp: Date.now() }
        }),
      { fcnName: 'endorseUser', logger, useAuth: true }
    )
  },
  UserResponse: {
    __resolveType: (obj: any) => (obj.commitId ? 'UserCommit' : obj.message ? 'UserError' : null)
  }
};
