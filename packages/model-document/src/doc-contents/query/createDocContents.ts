import gql from 'graphql-tag';

export const CREATE_DOC_CONTENTS = gql`
  mutation CreateDocContents($userId: String!, $documentId: String!, $content: DocsInput!) {
    createDocContents(userId: $userId, documentId: $documentId, content: $content) {
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
