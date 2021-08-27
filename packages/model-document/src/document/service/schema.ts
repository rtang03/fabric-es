import gql from 'graphql-tag';

export const typeDefs = gql`
  """
  The **DOCUMENT** schema proivdes the facilities to manage and manipulate the top-level public chain entity **Document**, which
  serve as a placeholder of supporting documents related to a particular loan request.
  """
  schema {
    query: Query
    mutation: Mutation
  }

  type Query {
    getCommitsByDocumentId(documentId: String!): [PubCommit]!

    "Get document by id from query handler"
    getDocumentById(documentId: String!): Document

    "List all doucments in a paginated manner"
    getPaginatedDocuments(cursor: Int, pageSize: Int = 10): PaginatedDocuments!

    "Search document by field(s) from the query handler"
    searchDocumentByFields(
      "Syntax: JSON \`{ [field name 1] = [value 1], [field name 2] = [value 2], ... }\`"
      where: String!
    ): [Document]

    "Free text search of documents"
    searchDocumentContains(contains: String!): [Document]
  }

  type Mutation {
    createDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String!
    ): PubResponse

    deleteDocument(userId: String!, documentId: String!): PubResponse

    "Update document status to \`Access Restricted\`"
    restrictAccess(userId: String!, documentId: String!): PubResponse

    "Update one or more updatable field(s) in a **Document** identified by the *userId* and *documentId*"
    updateDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      "NOTE: reference is non-updatable, included here for completeness sake, and as an example"
      reference: String
    ): [PubResponse]!
  }

  """
  @Primary **Document** represents any supporting documents, such as trade documents, shipping documents, custom declarations and etc., associating with an individual loan request. Each document is uniquely identified by a *documentId*.
  The document owners may also utilize the *reference* property as an exteranl identifier unique within resource owner's individual organizations. This publicly accessible entity is a placeholder without the actual content of the document.
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

  "Response from _mutation_ (create, update, delete) operations related to the **Document** type"
  union PubResponse = PubCommit | SrvError

  type Event {
    type: String
  }

  type PubCommit {
    id: String

    entityName: String

    version: Int

    "Timestamp - may not be sufficient. TODO: change to use UUID"
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
