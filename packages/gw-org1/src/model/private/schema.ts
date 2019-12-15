import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    # getDocContentsById(documentId: String!): DocContents!
    getDocContentsById(documentId: String!): DocContents
  }

  type Mutation {
    createDataDocContents(userId: String!, documentId: String!, body: String!): LocalResponse
    createFileDocContents(userId: String!, documentId: String!, format: String!, link: String!): LocalResponse
  }

  ###
  # Local Type: Doc Contents
  ###
  type DocContents @key(fields: "documentId") {
    documentId: String!
    content: Docs!
    timestamp: String!
    document: Document
  }

  union Docs = Data | File

  # Free style document content as structural data
  type Data {
    body: String!
  }

  # Note: this File entity is Private Data, but the uploaded files themselves are entirly off-chain
  type File {
    format: String!
    link: String!
  }

  ###
  # Mutation responses
  ###
  union LocalResponse = LocalCommit | LocalError

  type LocalCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
  }

  type LocalError {
    message: String!
    stack: String
  }

  ###
  # Federated types
  ###
  extend type Document @key(fields: "documentId") {
    documentId: String! @external
    contents: DocContents
  }
`;
