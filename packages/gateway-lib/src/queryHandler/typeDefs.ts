import gql from 'graphql-tag';

/**
 * @about type definition for queryHandler microservice
 */
export const typeDefs = gql`
  scalar JSON

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }

  type Subscription {
    pong: String
    entityAdded(entityName: String): EntityArrived
    systemEvent: SysNotification
  }

  type SysNotification {
    event: String
    message: String
    status: String
    error: String
    timestamp: Float
  }

  type EntityArrived {
    events: [String]
    key: String
  }

  type Query {
    me: String
    fullTextSearchCommit(query: String!, cursor: Int, pagesize: Int, param: String): PaginatedCommit!
    fullTextSearchEntity(entityName: String!, query: String!, cursor: Int, pagesize: Int, param: String): PaginatedEntity!
    getNotifications: [Notification!]!
    getNotification(entityName: String, id: String, commitId: String): [Notification]!
  }

  type Notification {
    creator: String!
    entityName: String!
    id: String!
    commitId: String
    read: Boolean!
  }

  type PaginatedEntity {
    total: Int
    cursor: Int
    hasMore: Boolean!
    items: [JSON!]!
  }

  type PaginatedCommit {
    total: Int
    cursor: Int
    hasMore: Boolean!
    items: [Commit!]!
  }

  type Mutation {
    ping(message: String): Boolean
    reloadEntities(entityNames: [String]): Boolean

    ###
    # e.g. payloadString
    # "{"id":"test_12","desc":"desc12","tag":"gw-lib"}"
    ###
    createCommit(entityName: String, id: String, type: String, payloadString: String): Commit!
  }

  ### OutputCommit
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
