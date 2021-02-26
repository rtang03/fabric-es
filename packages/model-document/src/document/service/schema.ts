import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    getCommitsByDocumentId(documentId: String!): [DocCommit]!
    getDocumentById(documentId: String!): Document
    getPaginatedDocuments(cursor: Int, pageSize: Int = 10): PaginatedDocuments!
    searchDocumentByFields(where: String!): [Document]
    searchDocumentContains(contains: String!): [Document]
  }

  type Mutation {
    createDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String!
    ): DocResponse
    deleteDocument(userId: String!, documentId: String!): DocResponse
    restrictAccess(userId: String!, documentId: String!): DocResponse
    updateDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String
    ): [DocResponse]!
  }

  type Document @key(fields: "documentId") {
    documentId: String!
    ownerId: String!
    loanId: String
    title: String
    reference: String!
    status: Int!
    timestamp: String!
    _organization: [String]!
    loan: Loan
  }

  type PaginatedDocuments {
    items: [Document!]!
    total: Int!
    hasMore: Boolean!
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
    mspId: String
    entityId: String
    events: [DocEvent!]
  }

  type DocError {
    message: String!
    stack: String
  }
`;
