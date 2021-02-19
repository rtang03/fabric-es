import gql from 'graphql-tag';

export const RESTRICT_DOCUMENT_ACCESS = gql`
  mutation RestrictAccess($userId: String!, $documentId: String!) {
    restrictAccess(userId: $userId, documentId: $documentId) {
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
