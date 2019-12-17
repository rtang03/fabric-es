import { RemoteData } from '@espresso/gw-node';
import gql from 'graphql-tag';
import { Resolvers } from '../generated/remotedata-resolvers';

export const resolvers: Resolvers = {
  Document: {
    _contents: async ({ documentId }, { token }, { remoteData }: RemoteData) =>
      remoteData({
        query: gql`
          query GetDocContentsById($documentId: String!) {
            getDocContentsById(documentId: $documentId) {
              documentId
              content {
                ... on Data {
                  body
                }
                ... on File {
                  link
                  format
                }
              }
              timestamp
            }
          }
        `,
        operationName: 'GetDocContentsById',
        variables: { documentId },
        token
      }).then(({ data }) => data?.getDocContentsById)
  },
  DocContents: {
    document: ({ documentId }) => ({ __typename: 'Document', documentId })
  },
  Docs: {
    __resolveType: (obj: any) => (obj?.body ? 'Data' : obj?.format ? 'File' : null)
  }
};
