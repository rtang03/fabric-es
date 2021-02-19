import gql from 'graphql-tag';

export const CREATE_DOC_CONTENTS = gql`
  mutation CreateDocContents($userId: String!, $documentId: String!, $content: DocsInput!) {
    createDocContents(userId: $userId, documentId: $documentId, content: $content) {
      ... on DocContentsCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocContentsError {
        message
      }
    }
  }
`;
