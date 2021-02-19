import gql from 'graphql-tag';

export const GET_DOCUMENT_BY_ID = gql`
  query GetDocumentById($documentId: String!) {
    getDocumentById(documentId: $documentId) {
      documentId
      ownerId
      loanId
      title
      reference
      status
      timestamp
      loan {
        loanId
        ownerId
        description
        reference
        status
        timestamp
      }
      contents {
        content {
          ... on Data {
            body
          }
          ... on File {
            format
            link
          }
        }
      }
    }
  }
`;
