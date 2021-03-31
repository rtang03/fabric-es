import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    getCommitsByDocumentId(documentId: String!): [DocCommit]!
    "Get document by id from query handler"
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

  """
  *Document* represents any supporting resources, such as trade documents, shipping documents, custom declarations, associating
  with individual loan requests. Each document is uniquely identified by _documentId_. The resource owners may
  also utilize the _reference_ property as their internal identifier unique within their individual organizations. The on-chain
  portion of a document is a placeholder, with a resource locator (the _link_ property) pointing to the document's details
  """
  type Document @key(fields: "documentId") {
    documentId: String!
    ownerId: String!
    loanId: String
    title: String
    "External unique reference of the document"
    reference: String!
    status: Int!
    timestamp: String!
    organization: [String]!
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
    "Timestamp - may not be sufficient"
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
