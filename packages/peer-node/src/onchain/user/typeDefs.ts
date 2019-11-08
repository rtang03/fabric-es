import gql from 'graphql-tag';

export const typeDefs = gql`
extend type Query {
  getPaginatedUser(cursor: Int = 10): PaginatedUser!
  getUserById(id: String!): User!
  me: User
}

type User @key(fields: "userId") {
  userId: String!
  name: String!
  mergedUserIds: [String!]
}

type UserInfo {
  userId: String
  name: String
  email: String
  website: String
}
`;