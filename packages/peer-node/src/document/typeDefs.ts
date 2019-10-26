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
    aboutDocument: String!
    createDocument(
      userId: String!
      tradeId: String!
      documentId: String!
      title: String!
      link: String!
      description: String!
    ): Entity1!
    getAllDocument: [Document]
    getCommitByDocumentId(id: String!): [Entity1!]!
    getPaginatedDocument(cursor: Int = 10): PaginatedDocument!
    getDocumentById(id: ID!): Document
  }

  type Document @key(fields: "documentId") {
    documentId: String!
    ownerId: String!
    tradeId: String!
    description: String
    title: String
    link: String
    approved: Boolean
    banned: Boolean
    reviewers: [String]
    reviewProcessCompleted: Boolean
    trade: Trade
  }

  extend type Trade @key(fields: "tradeId") {
    tradeId: String! @external
    documents: [Document]
  }

  type PaginatedDocument {
    entities: [Document!]!
    total: Int!
    hasMore: Boolean!
    otherInfo: [String!]!
  }

  type BaseEvent1 {
    type: String
  }

  type Entity1 {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
    events: [BaseEvent1!]
  }
`;
