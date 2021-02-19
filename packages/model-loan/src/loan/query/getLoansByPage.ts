import gql from 'graphql-tag';

export const GET_LOANS_BY_PAGE = gql`
  query GetLoansByPage($pageSize: Int) {
    getPaginatedLoans(pageSize: $pageSize) {
      total
      hasMore
      entities {
        loanId
        ownerId
        description
        reference
        comment
        status
        timestamp
      }
    }
  }
`;
