import gql from 'graphql-tag';

export const typeDefs = gql`
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }

  type Subscription {
    pong: String
    entityAdded(entityName: String): Notification
  }

  type Notification {
    events: [String]
    key: String
  }

  type Query {
    me: String
  }

  type Mutation {
    ping(message: String): Boolean
    reloadEntities(entityNames: [String]): Boolean
    createCommit(entityName: String, id: String, type: String, payloadString: String): Commit
  }

  type Commit {
    id: String
    entityName: String
    version: Int
    commitId: String
    entityId: String
  }
`;
