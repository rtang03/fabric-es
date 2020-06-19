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

export const UPDATE_DOC_CONTENTS = gql`
  mutation UpdateDocContents($userId: String!, $documentId: String!, $content: DocsInput!) {
    updateDocContents(userId: $userId, documentId: $documentId, content: $content) {
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
      organization
      timestamp
    }
  }
`;
