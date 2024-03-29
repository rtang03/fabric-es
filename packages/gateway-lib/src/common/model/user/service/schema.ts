
export const userTypeDefsQuery = `
  getCommitsByUserId(userId: String!): [UserCommit]!
  getPaginatedUser(cursor: Int, pageSize: Int = 10): PaginatedUsers!
  getUserById(userId: String!): User
  searchUserByFields(where: String!): [User]
  searchUserContains(contains: String!): [User]
  me: User
`;

export const userTypeDefsMutation = `
  createUser(name: String!, userId: String!): UserResponse
`;

export const userTypeDefsType = `
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
