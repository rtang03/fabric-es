import gql from 'graphql-tag';

// prettier-ignore
export const USER_BY_ID = gql`
  query USER_BY_ID($id: String!) {
    getUserById(id: $id) {
      userId
      name
      mergedUserIds
    }
  }
`;
