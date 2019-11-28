import { Commit } from '@espresso/fabric-cqrs';
import gql from 'graphql-tag';
import { User, userCommandHandler, UserDS } from '.';
import { Paginated } from '..';

export const typeDefs = gql`
type Query {
  getCommitsByUserId(userId: String!): [UserCommit]!
  getPaginatedUser(cursor: Int = 10): PaginatedUsers!
  getUserById(userId: String!): User!
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
      _, { userId }, { dataSources: { user }}: { dataSources: { user: UserDS }}): Promise<Commit[] | { error: any }> =>
      user.repo.getCommitById(userId)
        .then(({ data }) => data || [])
        .catch(error => ({ error })),
    getPaginatedUser: async (
      _, { cursor = 10 }, { dataSources: { user }}: { dataSources: { user: UserDS }}): Promise<Paginated<User> | { error: any }> =>
      user.repo.getByEntityName()
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
      _, { userId }, { dataSources: { user }}): Promise<User | { error: any }> =>
      user.repo.getById({ id: userId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    createUser: async (
      _, { name, userId }, { dataSources: { user }, enrollmentId }: { dataSources: { user: UserDS }, enrollmentId: string }
    ): Promise<Commit> =>
      userCommandHandler({
        enrollmentId,
        userRepo: user.repo
      }).CreateUser({
        userId,
        payload: { name, timestamp: Date.now() }
      }),
  },
  UserResponse: {
    __resolveType(obj, _, __) {
      if (obj.commitId) {
        return 'UserCommit';
      }
      if (obj.message) {
        return 'UserError';
      }
      return {};
    }
  }
};
