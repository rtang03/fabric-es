import gql from 'graphql-tag';

export const CREATE_DATA_DOC_CONTENTS = gql`
mutation CreateDataDocContents(
  $userId: String!,
  $documentId: String!,
  $body: String!
) {
    createDataDocContents(
      userId: $userId,
      documentId: $documentId,
      body: $body
  ) {
    ... on LocalCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on LocalError {
      message
    }
  }
}`;

export const CREATE_FILE_DOC_CONTENTS = gql`
mutation CreateFileDocContents(
  $userId: String!,
  $documentId: String!,
  $format: String!,
  $link: String!
) {
  createFileDocContents(
    userId: $userId,
    documentId: $documentId,
    format: $format,
    link: $link
  ) {
    ... on LocalCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on LocalError {
      message
    }
  }
}`;

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
}`;

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
    timestamp
  }
}`;