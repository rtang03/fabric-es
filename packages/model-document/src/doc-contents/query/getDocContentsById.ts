import gql from 'graphql-tag';

export const GET_DOC_CONTENTS_BY_ID = gql`
  query GetDocContentsById($documentId: String!) {
    getDocContentsById(documentId: $documentId) {
      documentId
      document {
        ownerId
        loanId
        title
        reference
        status
        timestamp
      }
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
