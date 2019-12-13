import gql from 'graphql-tag';

export const CREATE_LOAN_DETAILS = gql`
mutation CreateLoanDetails(
  $userId: String!,
  $loanId: String!,
  $registration: String!,
  $companyName: String!,
  $requesterType: String,
  $salutation: String,
  $contactName: String!,
  $contactTitle: String,
  $contactPhone: String!,
  $contactEmail: String!,
  $loanType: String,
  $startDate: String!,
  $tenor: Int!,
  $currency: String!,
  $requestedAmt: Float!,
  $approvedAmt: Float,
  $comment: String
) {
  createLoanDetails(
    userId: $userId,
    loanId: $loanId,
    requester: {
      registration: $registration,
      name: $companyName,
      type: $requesterType
    },
    contact: {
      salutation: $salutation,
      name: $contactName,
      title: $contactTitle,
      phone: $contactPhone,
      email: $contactEmail
    },
    loanType: $loanType,
    startDate: $startDate,
    tenor: $tenor,
    currency: $currency,
    requestedAmt: $requestedAmt,
    approvedAmt: $approvedAmt,
    comment: $comment
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

export const GET_DETAILS_BY_ID = gql`
query GetLoanDetailsById($loanId: String!) {
  getLoanDetailsById(loanId: $loanId) {
    loanId
    loan {
      ownerId
      description
      reference
      status
      timestamp
    }
    requester {
      registration
      name
      type
    }
    contact {
      salutation
      name
      title
      phone
      email
    }
    loanType
    startDate
    tenor
    currency
    requestedAmt
    approvedAmt
    comment
    timestamp
  }
}`;

export const UPDATE_LOAN_DETAILS = gql`
mutation UpdateLoanDetails(
  $userId: String!,
  $loanId: String!,
  $registration: String,
  $companyName: String,
  $requesterType: String,
  $salutation: String,
  $contactName: String,
  $contactTitle: String,
  $contactPhone: String,
  $contactEmail: String,
  $loanType: String,
  $startDate: String,
  $tenor: Int,
  $currency: String,
  $requestedAmt: Float,
  $approvedAmt: Float,
  $comment: String
) {
  updateLoanDetails(
    userId: $userId,
    loanId: $loanId,
    requester: {
      registration: $registration,
      name: $companyName,
      type: $requesterType
    },
    contact: {
      salutation: $salutation,
      name: $contactName,
      title: $contactTitle,
      phone: $contactPhone,
      email: $contactEmail
    },
    loanType: $loanType,
    startDate: $startDate,
    tenor: $tenor,
    currency: $currency,
    requestedAmt: $requestedAmt,
    approvedAmt: $approvedAmt,
    comment: $comment
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

export const GET_CONTENTS_BY_ID = gql`
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