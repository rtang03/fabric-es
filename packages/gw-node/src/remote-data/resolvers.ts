import gql from 'graphql-tag';
import { RemoteData } from './remoteData';

export const resolvers = {
  Document: {
    contents: async ({ documentId }, _, { remoteData }: RemoteData) =>
      remoteData({
        query: gql`
          query GetDocContentsById($documentId: String!) {
            getDocContentsById(documentId: $documentId) {
              documentId
              timestamp
              content {
                ... on Data {
                  body
                }
                ... on File {
                  link
                  format
                }
              }
            }
          }
        `,
        operationName: 'GetDocContentsById',
        variables: { documentId }
      })
  },
  DocContents: {
    document: ({ documentId }) => ({ __typename: 'Document', documentId })
  },
  Docs: {
    __resolveType: obj => (obj?.body ? 'Data' : obj?.format ? 'File' : {})
  },
  LocalResponse: {
    __resolveType: obj =>
      obj?.commitId ? 'LocalCommit' : obj?.message ? 'LocalError' : {}
  }
};
