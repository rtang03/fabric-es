import gql from 'graphql-tag';

export const APPLY_LOAN = gql`
mutation ApplyLoan(
  $userId: String!,
  $loanId: String!,
  $description: String,
  $reference: String!,
  $loaner: String!
) {
  applyLoan(
    userId: $userId,
    loanId: $loanId,
    description: $description,
    reference: $reference,
    loaner: $loaner
  ) {
    id
    entityName
    version
    commitId
    committedAt
  }
}`;

export const CANCEL_LOAN = gql`
mutation CancelLoan($userId: String!, $loanId: String!) {
  cancelLoan(userId: $userId, loanId: $loanId) {
    id
    entityName
    version
    commitId
    committedAt
  }
}`;

export const APPROVE_LOAN = gql`
mutation ApproveLoan($userId: String!, $loanId: String!) {
  approveLoan(userId: $userId, loanId: $loanId) {
    id
    entityName
    version
    commitId
    committedAt
  }
}`;

export const RETURN_LOAN = gql`
mutation ReturnLoan($userId: String!, $loanId: String!) {
  returnLoan(userId: $userId, loanId: $loanId) {
    id
    entityName
    version
    commitId
    committedAt
  }
}`;

export const REJECT_LOAN = gql`
mutation RejectLoan($userId: String!, $loanId: String!) {
  rejectLoan(userId: $userId, loanId: $loanId) {
    id
    entityName
    version
    commitId
    committedAt
  }
}`;

export const EXPIRE_LOAN = gql`
mutation ExpireLoan($userId: String!, $loanId: String!) {
  expireLoan(userId: $userId, loanId: $loanId) {
    id
    entityName
    version
    commitId
    committedAt
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
    loaner
    status
    timestamp
  }
}`;
