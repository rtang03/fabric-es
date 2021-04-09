import gql from 'graphql-tag';

export const typeDefs = gql`
  """
  Schema level comment. However should not do this because the schema definition should be omitted when using
  default root operation type names (Query, Mutation and Subscription)
  """
  schema {
    query: Query
    mutation: Mutation
  }

  type Query {
    getCommitsByDocumentId(documentId: String!): [DocCommit]!

    "Get document by id from query handler"
    getDocumentById(documentId: String!): Document

    getPaginatedDocuments(cursor: Int, pageSize: Int = 10): PaginatedDocuments!

    searchDocumentByFields(
      "Syntax: JSON \`{ [field name 1] = [value 1], [field name 2] = [value 2], ... }\`"
      where: String!
    ): [Document]

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

    "Update one or more updatable field(s) in a *Document* identified by the *userId* and *documentId*"
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
    loan: Loan
  }

  "For querying multiple documents in pages"
  type PaginatedDocuments {
    items: [Document!]!
    total: Int!
    hasMore: Boolean!
  }

  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    documents: [Document]
  }

  "Response from a _mutation_ (create, update, delete) operation"
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
