import gql from 'graphql-tag';

export const GET_USERS_BY_PAGE = gql`
  query GetUsersByPage($cursor: Int!) {
    getPaginatedUser(cursor: $cursor) {
      total
      hasMore
      entities {
        name
        userId
      }
    }
  }
`;
