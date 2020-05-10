import gql from 'graphql-tag';

export const typeDefs = gql`
  type Mutation {
    increment(counterId: String!): Commit!
    decrement(counterId: String!): Commit!
  }
  type Query {
    pingCounter: String!
    getCounter(counterId: String!): Counter!
  }
  type Counter {
    value: Int!
  }
  type Commit {
    id: String
    entityName: String
    version: Int
    commitId: String
    entityId: String
  }
`;
