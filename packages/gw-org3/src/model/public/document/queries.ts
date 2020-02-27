import gql from 'graphql-tag';

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument(
    $userId: String!
    $documentId: String!
    $loanId: String
    $title: String
    $reference: String!
  ) {
    createDocument(userId: $userId, documentId: $documentId, loanId: $loanId, title: $title, reference: $reference) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        committedAt
      }
      ... on DocError {
        message
      }
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($userId: String!, $documentId: String!) {
    deleteDocument(userId: $userId, documentId: $documentId) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        committedAt
      }
      ... on DocError {
        message
      }
    }
  }
`;

export const RESTRICT_DOCUMENT_ACCESS = gql`
  mutation RestrictAccess($userId: String!, $documentId: String!) {
    restrictAccess(userId: $userId, documentId: $documentId) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        committedAt
      }
      ... on DocError {
        message
      }
    }
  }
`;

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument($userId: String!, $documentId: String!, $loanId: String, $title: String, $reference: String) {
    updateDocument(userId: $userId, documentId: $documentId, loanId: $loanId, title: $title, reference: $reference) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        committedAt
      }
      ... on DocError {
        message
      }
    }
  }
`;

export const GET_COMMITS_BY_DOCUMENT = gql`
  query GetCommitsByDocument($documentId: String!) {
    getCommitsByDocumentId(documentId: $documentId) {
      id
      entityName
      version
      commitId
      committedAt
      events {
        type
      }
    }
  }
`;

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
