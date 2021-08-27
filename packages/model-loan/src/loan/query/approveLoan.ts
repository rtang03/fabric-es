import gql from 'graphql-tag';

export const APPROVE_LOAN = gql`
  mutation ApproveLoan($userId: String!, $loanId: String!) {
    approveLoan(userId: $userId, loanId: $loanId) {
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
