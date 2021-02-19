import gql from 'graphql-tag';

export const GET_CONTENTS_BY_ID = gql`
  query GetDocContentsById($documentId: String!) {
    getDocContentsById(documentId: $documentId) {
      documentId
      content {
        ... on Data {
          body
        }
        ... on File {
          format
          link
        }
      }
      timestamp
    }
  }
`;
