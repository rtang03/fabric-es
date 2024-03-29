import gql from 'graphql-tag';

export const typeDefs = gql`
  """
  @schema The **DOC CONTENTS** schema provides the facilities to manage and manipulate the privte chain entity **DocContents**, which
  contains the actual content of a particular supporting document, accessable only under permission.
  """

  type Query {
    getDocContentsById(documentId: String!): DocContents
  }

  type Mutation {
    createDocContents(userId: String!, documentId: String!, content: DocsInput!): PrvResponse
    updateDocContents(userId: String!, documentId: String!, content: DocsInput!): PrvResponse
  }

  """
  @Primary **DocContents** is an entity stored on the private-chain with data not suppose to be globally accessible. It contains
  either the data of the actual document or the link to access the document.
  """
  type DocContents @key(fields: "documentId") {
    documentId: String!

    "Can be data or link to file"
    content: Docs!

    timestamp: String!

    document: Document
  }

  input DocsInput {
    body: String
    format: String
    link: String
  }

  "Actual content of the document"
  union Docs = Data | File

  type Data {
    "Free style document content as structural data"
    body: String!
  }

  "Note: this File entity is Private Data, but the uploaded files themselves are entirly off-chain, accessed via the \`link\` field"
  type File {
    "Free text, indicator of the file format of the document (such as PDF)"
    format: String!

    "URL of the actual document"
    link: String!
  }

  type Event {
    type: String
  }

  """
  Response from _mutation_ (create, update, delete) operations related to the **DocContents** type
  """
  union PrvResponse = PrvCommit | SrvError

  "Place holder for the actual private chain data structure of **DocContents**"
  type PrvCommit {
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

  ###
  # Federated types
  ###
  extend type Document @key(fields: "documentId") {
    documentId: String! @external
    contents: [DocContents]
  }
`;
