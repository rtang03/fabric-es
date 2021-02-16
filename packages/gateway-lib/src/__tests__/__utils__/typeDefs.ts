import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON

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
    commitId: String
    creator: String!
    entityId: String
    entityName: String
    event: String
    events: [JSON]
    eventsString: String
    id: String
    mspId: String
    ts: Float
    version: Int
  }
`;
