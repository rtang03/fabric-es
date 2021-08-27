import gql from 'graphql-tag';

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
