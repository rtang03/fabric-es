import gql from 'graphql-tag';

export const typeDefs = gql`
  extend type Query {
    getCommitsByDocumentId(documentId: String!): [DocumentCommit]!
    getDocumentById(documentId: String!): Document
  }

  type Mutation {
    createDocument(
      userId: String!,
      documentId: String!,
      loanId: String,
      title: String,
      reference: String!,
      link: String!
    ): DocumentCommit
    deleteDocument(userId: String!, documentId: String!): DocumentCommit
    restrictAccess(userId: String!, documentId: String!): DocumentCommit
  }

  type Document @key(fields: "documentId") {
    documentId: String!
    ownerId: String!
    loanId: String
    title: String
    reference: String!
    link: String!
    status: String!
    timestamp: String!
  }

  type DocEvent {
    type: String
  }

  type DocumentCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
    events: [DocEvent!]
  }
`;
