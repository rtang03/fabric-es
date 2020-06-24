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
    systemEvent: Notification
  }

  type Notification {
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
    fullTextSearchCommit(query: String): [Commit]
    fullTextSearchEntity(query: String): [MetaEntity]
    metaGetEntityByEntNameEntId(
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
    ): [MetaEntity]
    metaGetCommitByEntNameEntId(
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
    ): [Commit]
  }

  enum SearchScope {
    CREATED
    LAST_MODIFIED
  }

  type MetaEntity {
    id: String!
    entityName: String!
    value: String!
    commits: [String!]!
    events: String!
    desc: String!
    tag: String!
    created: Float!
    creator: String!
    lastModified: Float!
    timeline: String!
    reducer: String!
  }

  type Mutation {
    ping(message: String): Boolean
    reloadEntities(entityNames: [String]): Boolean

    ###
    # e.g. payloadString
    # "{"id":"test_12","desc":"desc12","tag":"gw-lib"}"
    ###
    createCommit(entityName: String, id: String, type: String, payloadString: String): Commit
  }

  type Commit {
    id: String
    entityName: String
    version: Int
    commitId: String
    entityId: String
    eventsString: String
  }
`;
