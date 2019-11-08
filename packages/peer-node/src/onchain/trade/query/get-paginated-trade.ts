import gql from 'graphql-tag';

// prettier-ignore
export const PAGINATED_TRADE = gql`
  query PAGINATED_TRADE(
    $cursor: Int!
  ) {
    getPaginatedTrade(
      cursor: $cursor
    ) {
      total
      hasMore
      entities {
        tradeId
        title
        description
      }
    }
  }
`;
