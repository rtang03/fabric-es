import gql from 'graphql-tag';

/*
NOTE!!! This is the type definition publish by an ORG, who has certain private-data to share to other ORGs.
An ORG wants to access this private-data need to run a federated Apollo server behind its gateway using this
type definition.
*/
export const typeDefs = gql`
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

  extend type Document @key(fields: "documentId") {
    documentId: String! @external
    contents: [DocContents]
  }
`;
