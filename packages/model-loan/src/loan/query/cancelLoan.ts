import gql from 'graphql-tag';

export const CANCEL_LOAN = gql`
  mutation CancelLoan($userId: String!, $loanId: String!) {
    cancelLoan(userId: $userId, loanId: $loanId) {
      ... on PubCommit {
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
