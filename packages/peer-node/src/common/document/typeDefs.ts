import gql from 'graphql-tag';

export const typeDefs = gql`
  extend type Query {
    getCommitsByDocumentId(documentId: String!): [DocCommit]!
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
    ): DocResponse
    deleteDocument(userId: String!, documentId: String!): DocResponse
    restrictAccess(userId: String!, documentId: String!): DocResponse
    updateDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String
      link: String
    ): [DocResponse]!
  }

  type Document @key(fields: "documentId") {
    documentId: String!
    ownerId: String!
    loanId: String
    title: String
    reference: String!
    link: String!
    status: Int!
    timestamp: String!
    loan: Loan
  }

  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    documents: [Document]
  }

  union DocResponse = DocCommit | DocError

  type DocEvent {
    type: String
  }

  type DocCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
    events: [DocEvent!]
  }

  type DocError {
    message: String!
    stack: String
  }
`;
