import gql from 'graphql-tag';

export const typeDefs = gql`
  # type Subscription {
  #    toDocument(entityName: String!, events: [String!]!, id: String!): Entity
  #    toDocuments(entityName: String!, events: [String!]!): Entity
  #    toTrade(entityName: String!, events: [String!]!, id: String!): Entity
  #    toTrades(entityName: String!, events: [String!]!): Entity
  #    toUser(entityName: String!, events: [String!]!, id: String!): Entity
  #    toUsers(entityName: String!, events: [String!]!): Entity
  #  }

  extend type Query {
    aboutTrade: String!
    aboutUser: String!
    createTrade(
      userId: String!
      tradeId: String!
      title: String!
      description: String!
    ): Entity!
    createUser(name: String!, userId: String!): Entity!
    getAllTrade: [Trade]
    getAllUser: [User]
    getCommitByTradeId(id: String!): [Entity!]!
    getCommitByUserId(id: String!): [Entity!]!
    getPaginatedTrade(cursor: Int = 10): PaginatedTrade!
    getPaginatedUser(cursor: Int = 10): PaginatedUser!
    getTradeById(id: ID!): Trade
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

  type Trade @key(fields: "tradeId") {
    tradeId: String!
    description: String
    title: String
    privileges: TradePrivilegeConditions
    editors: Editors
  }

  type TradePermission {
    users: [String!]
  }

  type TradePrivilegeConditions {
    canApproveDocument: TradePermission
    canBanDocument: TradePermission
    canCreateDocument: TradePermission
    canDeleteDocument: TradePermission
    canDeleteTrade: TradePermission
    canReviewDocument: TradePermission
    canSubmitDocument: TradePermission
    canUpdateDocument: TradePermission
    canUpdateEditor: TradePermission
    canUpdatePrivilege: TradePermission
    canUpdateTrade: TradePermission
  }

  type Editors {
    invited: [UserInfo!]
    confirmed: [UserInfo!]
  }

  type PaginatedTrade {
    entities: [Trade!]!
    total: Int!
    hasMore: Boolean!
    otherInfo: [String!]!
  }

  type PaginatedUser {
    entities: [User!]!
    total: Int!
    hasMore: Boolean!
    otherInfo: [String!]!
  }

  type BaseEvent {
    type: String
  }

  type Entity {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
    events: [BaseEvent!]
  }
`;
