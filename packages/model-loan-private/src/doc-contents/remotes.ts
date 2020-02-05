import { RemoteData } from '@espresso/gw-node';
import gql from 'graphql-tag';
import { GET_CONTENTS_BY_ID } from '.';

export const typeDefs = gql`
  ###
  # Local Type: Doc Contents
  ###
  type _DocContents @key(fields: "documentId") {
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
    _contents: _DocContents
  }
`;

export const resolvers = {
  Document: {
    _contents: async ({ documentId }, { uri, token }, { remoteData }: RemoteData) => {
      return remoteData({
        uri,
        query: GET_CONTENTS_BY_ID,
        operationName: 'GetDocContentsById',
        variables: { documentId },
        token
      }).then(({ data }) => data?.getDocContentsById);
    }
  },
  DocContents: {
    document: ({ documentId }) => ({ __typename: 'Document', documentId })
  },
  Docs: {
    __resolveType: (obj: any) => (obj?.body ? 'Data' : obj?.format ? 'File' : null)
  }
};