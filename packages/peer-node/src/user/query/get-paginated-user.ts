import gql from 'graphql-tag';

// prettier-ignore
export const PAGINATED_USER = gql`
  query PAGINATED_USER(
    $cursor: Int!
  ) {
    getPaginatedUser(
      cursor: $cursor
    ) {
      total
      hasMore
      entities {
        name
        userId
      }
    }
  }
`;
