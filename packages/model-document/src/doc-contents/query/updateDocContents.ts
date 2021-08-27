import gql from 'graphql-tag';

export const UPDATE_DOC_CONTENTS = gql`
  mutation UpdateDocContents($userId: String!, $documentId: String!, $content: DocsInput!) {
    updateDocContents(userId: $userId, documentId: $documentId, content: $content) {
      ... on PrvCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on SrvError {
        message
      }
    }
  }
`;
