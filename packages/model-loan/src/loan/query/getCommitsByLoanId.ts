import gql from 'graphql-tag';

export const GET_COMMITS_BY_LOAN = gql`
  query GetCommitsByLoanId($loanId: String!) {
    getCommitsByLoanId(loanId: $loanId) {
      id
      entityName
      version
      commitId
      entityId
      mspId
      events {
        type
      }
    }
  }
`;
