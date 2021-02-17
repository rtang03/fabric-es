import gql from 'graphql-tag';

export const APPLY_LOAN = gql`
  mutation ApplyLoan($userId: String!, $loanId: String!, $description: String!, $reference: String!, $comment: String) {
    applyLoan(userId: $userId, loanId: $loanId, description: $description, reference: $reference, comment: $comment) {
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
