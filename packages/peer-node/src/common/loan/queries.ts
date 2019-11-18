import gql from 'graphql-tag';

export const APPLY_LOAN = gql`
mutation ApplyLoan(
  $userId: String!
  $loanId: String!
  $description: String
  $reference: String!
) {
  applyLoan(
    userId: $userId
    loanId: $loanId
    description: $description
    reference: $reference
  ) {
    ... on LoanCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on LoanError {
      message
    }
  }
}`;

export const CANCEL_LOAN = gql`
mutation CancelLoan($userId: String!, $loanId: String!) {
  cancelLoan(userId: $userId, loanId: $loanId) {
    ... on LoanCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on LoanError {
      message
    }
  }
}`;

export const APPROVE_LOAN = gql`
mutation ApproveLoan($userId: String!, $loanId: String!) {
  approveLoan(userId: $userId, loanId: $loanId) {
    ... on LoanCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on LoanError {
      message
    }
  }
}`;

export const RETURN_LOAN = gql`
mutation ReturnLoan($userId: String!, $loanId: String!) {
  returnLoan(userId: $userId, loanId: $loanId) {
    ... on LoanCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on LoanError {
      message
    }
  }
}`;

export const REJECT_LOAN = gql`
mutation RejectLoan($userId: String!, $loanId: String!) {
  rejectLoan(userId: $userId, loanId: $loanId) {
    ... on LoanCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on LoanError {
      message
    }
  }
}`;

export const EXPIRE_LOAN = gql`
mutation ExpireLoan($userId: String!, $loanId: String!) {
  expireLoan(userId: $userId, loanId: $loanId) {
    ... on LoanCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on LoanError {
      message
    }
  }
}`;

export const UPDATE_LOAN = gql`
mutation UpdateLoan(
  $userId: String!
  $loanId: String!
  $reference: String
  $description: String
) {
  updateLoan(
    userId: $userId
    loanId: $loanId
    reference: $reference
    description: $description
  ) {
    ... on LoanCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on LoanError {
      message
    }
  }
}`;

export const GET_COMMITS_BY_LOAN = gql`
query GetCommitsByLoanId($loanId: String!) {
  getCommitsByLoanId(loanId: $loanId) {
    id
    entityName
    version
    commitId
    committedAt
    events {
      type
    }
  }
}`;

export const GET_LOAN_BY_ID = gql`
query GetLoanById($loanId: String!) {
  getLoanById(loanId: $loanId) {
    loanId
    ownerId
    description
    reference
    status
    timestamp
    documents {
      documentId
      title
      reference
      link
      status
      timestamp
    }
  }
}`;
