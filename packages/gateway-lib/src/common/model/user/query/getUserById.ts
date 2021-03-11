import gql from 'graphql-tag';

export const GET_USER_BY_ID = gql`
  query GetUserById($userId: String!) {
    getUserById(userId: $userId) {
      userId
      name
      mergedUserIds
    }
  }
`;
