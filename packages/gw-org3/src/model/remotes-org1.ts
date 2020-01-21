import { GET_CONTENTS_BY_ID, RemoteData } from '@espresso/model-loan-private';
import gql from 'graphql-tag';

export const remoteTypeDefs = gql`
  type Org1MSP_DocContents @key(fields: "documentId") {
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
    """
    Doc Contents from org1
    """
    Org1MSP_contents(token: String): Org1MSP_DocContents
  }
`;

export const remoteResolvers = {
  Document: {
    Org1MSP_contents: async ({ documentId }, { token }, { remoteData }: RemoteData) => {
      return remoteData({
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