import gql from 'graphql-tag';

export const REJECT_LOAN = gql`
  mutation RejectLoan($userId: String!, $loanId: String!) {
    rejectLoan(userId: $userId, loanId: $loanId) {
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
