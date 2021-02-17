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
