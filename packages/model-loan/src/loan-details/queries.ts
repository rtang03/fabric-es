import gql from 'graphql-tag';

export const CREATE_LOAN_DETAILS = gql`
  mutation CreateLoanDetails(
    $userId: String!
    $loanId: String!
    $requester: LoanRequesterInput!
    $contact: ContactInfoInput!
    $loanType: String
    $startDate: String!
    $tenor: Int!
    $currency: String!
    $requestedAmt: Float!
    $approvedAmt: Float
    $comment: String
  ) {
    createLoanDetails(
      userId: $userId
      loanId: $loanId
      requester: $requester
      contact: $contact
      loanType: $loanType
      startDate: $startDate
      tenor: $tenor
      currency: $currency
      requestedAmt: $requestedAmt
      approvedAmt: $approvedAmt
      comment: $comment
    ) {
      ... on LoanDetailsCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on LoanDetailsError {
        message
      }
    }
  }
`;

export const GET_LOAN_DETAILS_BY_ID = gql`
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
  }
`;

export const GET_DETAILS_BY_ID = gql`
  query GetLoanDetailsById($loanId: String!) {
    getLoanDetailsById(loanId: $loanId) {
      loanId
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
    }
  }
`;

export const UPDATE_LOAN_DETAILS = gql`
  mutation UpdateLoanDetails(
    $userId: String!
    $loanId: String!
    $requester: LoanRequesterInput
    $contact: ContactInfoInput
    $loanType: String
    $startDate: String
    $tenor: Int
    $currency: String
    $requestedAmt: Float
    $approvedAmt: Float
    $comment: String
  ) {
    updateLoanDetails(
      userId: $userId
      loanId: $loanId
      requester: $requester
      contact: $contact
      loanType: $loanType
      startDate: $startDate
      tenor: $tenor
      currency: $currency
      requestedAmt: $requestedAmt
      approvedAmt: $approvedAmt
      comment: $comment
    ) {
      ... on LoanDetailsCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on LoanDetailsError {
        message
      }
    }
  }
`;
