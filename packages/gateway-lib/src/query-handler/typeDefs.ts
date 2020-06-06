import gql from 'graphql-tag';

export const typeDefs = gql`
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }

  type Subscription {
    somethingChanged: Result
  }

  type Result {
    id: String
  }

  type Query {
    queryByEntityId(entityName: String!, id: String!): [Commit]
  }

  type Mutation {
    addMessage(message: String): Boolean
  }

  type Commit {
    id: String
    entityName: String
    version: Int
    commitId: String
    entityId: String
  }
`;
