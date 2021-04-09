import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    getDocContentsById(documentId: String!): DocContents
  }

  type Mutation {
    createDocContents(userId: String!, documentId: String!, content: DocsInput!): DocContentsResp
    updateDocContents(userId: String!, documentId: String!, content: DocsInput!): DocContentsResp
  }

  """
  *DocContents* is an entity stored in the private-chain with data not suppose to be globally accessible. It contains
  either the data of the actual document or the link to access the document.
  """
  type DocContents @key(fields: "documentId") {
    documentId: String!
    content: Docs!
    timestamp: String!
    _organization: [String]!
    document: Document
  }

  input DocsInput {
    body: String
    format: String
    link: String
  }

  union Docs = Data | File

  type Data {
    "Free style document content as structural data"
    body: String!
  }

  "Note: this File entity is Private Data, but the uploaded files themselves are entirly off-chain"
  type File {
    format: String!
    link: String!
  }

  """
  Response from _mutation_ (create, update, delete) operations related to the *DocContents* type
  """
  union DocContentsResp = DocContentsCommit | DocContentsError

  type DocContentsCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    mspId: String
    entityId: String
  }

  type DocContentsError {
    message: String!
    stack: String
  }

  ###
  # Federated types
  ###
  extend type Document @key(fields: "documentId") {
    documentId: String! @external
    contents: [DocContents]
  }
`;
