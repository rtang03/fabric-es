import gql from 'graphql-tag';

// prettier-ignore
export const USERS = gql`
  query USERS {
    getAllUser {
      userId
      name
    }
  }
`;
