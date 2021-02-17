import gql from 'graphql-tag';

export const REJECT_LOAN = gql`
  mutation RejectLoan($userId: String!, $loanId: String!) {
    rejectLoan(userId: $userId, loanId: $loanId) {
      ... on LoanCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on LoanError {
        message
      }
    }
  }
`;
