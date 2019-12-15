import { RemoteData } from '@espresso/gw-node';
import { ApolloError } from 'apollo-server';
import gql from 'graphql-tag';

export const resolvers = {
  Document: {
    contents: async ({ documentId }, _, { remoteData }: RemoteData) =>
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
        variables: { documentId }
      }).then(({ data, errors }) => {
        if (errors) throw new ApolloError(errors[0].message);
        return data?.getDocContentsById;
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
