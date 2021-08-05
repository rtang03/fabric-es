import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    getCommitsByDocumentId(documentId: String!): [PubCommit]!
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
      link: String!
    ): PubResponse
    deleteDocument(userId: String!, documentId: String!): PubResponse
    restrictAccess(userId: String!, documentId: String!): PubResponse
    updateDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String
      link: String
    ): [PubResponse]!
  }

  type Document @key(fields: "documentId") {
    documentId: String!
    ownerId: String!
    loanId: String
    title: String
    reference: String!
    link: String
    status: Int!
    timestamp: String!
    loan: Loan
  }

  type PaginatedDocuments {
    entities: [Document!]!
    total: Int!
    hasMore: Boolean!
  }

  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    documents: [Document]
  }

  union PubResponse = PubCommit | SrvError

  type Event {
    type: String
  }

  type PubCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    mspId: String
    entityId: String
    events: [Event!]
  }

  type SrvError {
    message: String!
    stack: String
  }
`;
