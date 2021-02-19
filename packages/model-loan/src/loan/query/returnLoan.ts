import gql from 'graphql-tag';

export const RETURN_LOAN = gql`
  mutation ReturnLoan($userId: String!, $loanId: String!) {
    returnLoan(userId: $userId, loanId: $loanId) {
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
