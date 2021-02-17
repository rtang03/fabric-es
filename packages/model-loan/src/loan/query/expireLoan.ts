import gql from 'graphql-tag';

export const EXPIRE_LOAN = gql`
  mutation ExpireLoan($userId: String!, $loanId: String!) {
    expireLoan(userId: $userId, loanId: $loanId) {
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
