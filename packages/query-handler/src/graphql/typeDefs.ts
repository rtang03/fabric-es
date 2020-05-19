import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    queryByEntityId(entityName: String!, id: String!): [Commit]
  }
  type Commit {
    id: String
    entityName: String
    version: Int
    commitId: String
    entityId: String
  }
`;
