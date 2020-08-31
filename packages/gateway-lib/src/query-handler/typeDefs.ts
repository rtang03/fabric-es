import gql from 'graphql-tag';

export const typeDefs = gql`
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
    getEntityInfo: [EntityInfo!]!
    fullTextSearchCommit(query: String!, cursor: Int, pagesize: Int): PaginatedCommit!
    fullTextSearchEntity(query: String!, cursor: Int, pagesize: Int): PaginatedEntity!
    paginatedEntity(
      creator: String
      cursor: Int
      pagesize: Int
      entityName: String!
      id: String
      scope: SearchScope
      startTime: Int
      endTime: Int
      sortByField: String
      sort: String
    ): PaginatedEntity!
    paginatedCommit(
      creator: String
      cursor: Int
      pagesize: Int
      entityName: String!
      id: String
      events: [String!]
      startTime: Int
      endTime: Int
      sortByField: String
      sort: String
    ): PaginatedCommit!
    getNotifications: [Notification!]!
    getNotification(entityName: String, id: String, commitId: String): Notification!
  }

  type Notification {
    creator: String!
    entityName: String!
    id: String!
    commitId: String!
    read: Boolean!
  }

  type EntityInfo {
    entityName: String!
    total: Int!
    events: [String!]!
    tagged: [String!]!
    creators: [String!]!
    orgs: [String!]!
    totalCommit: Int!
  }

  enum SearchScope {
    CREATED
    LAST_MODIFIED
  }

  type PaginatedEntity {
    total: Int
    cursor: Int
    hasMore: Boolean!
    items: [QueryHandlerEntity!]!
  }

  type PaginatedCommit {
    total: Int
    cursor: Int
    hasMore: Boolean!
    items: [Commit!]!
  }

  type QueryHandlerEntity {
    id: String!
    entityName: String!
    value: String!
    commits: [String!]!
    events: String!
    desc: String
    tag: String
    created: Float!
    creator: String!
    lastModified: Float!
    timeline: String!
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

  type Commit {
    id: String
    mspId: String
    entityName: String
    version: Int
    commitId: String
    entityId: String
    eventsString: String
  }
`;
