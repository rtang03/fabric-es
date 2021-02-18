import gql from 'graphql-tag';

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($userId: String!, $documentId: String!) {
    deleteDocument(userId: $userId, documentId: $documentId) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocError {
        message
      }
    }
  }
`;
