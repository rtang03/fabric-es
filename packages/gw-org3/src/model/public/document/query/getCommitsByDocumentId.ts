import gql from 'graphql-tag';

export const GET_COMMITS_BY_DOCUMENT = gql`
  query GetCommitsByDocument($documentId: String!) {
    getCommitsByDocumentId(documentId: $documentId) {
      id
      entityName
      version
      commitId
      entityId
      mspId
      events {
        type
      }
    }
  }
`;
