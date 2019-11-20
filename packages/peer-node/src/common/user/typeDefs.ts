import gql from 'graphql-tag';

export const typeDefs = gql`
extend type Query {
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
