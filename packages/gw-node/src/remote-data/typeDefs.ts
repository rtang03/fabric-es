import gql from 'graphql-tag';

export const typeDefs = gql`
  type DocContents @key(fields: "documentId") {
    documentId: String!
    content: Docs!
    timestamp: String!
    document: Document
  }
  union Docs = Data | File
  type Data {
    body: String!
  }
  type File {
    format: String!
    link: String!
  }
  extend type Document @key(fields: "documentId") {
    documentId: String! @external
    contents: DocContents
  }
`;
