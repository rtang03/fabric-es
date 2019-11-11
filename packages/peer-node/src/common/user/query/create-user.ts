import gql from 'graphql-tag';

// prettier-ignore
export const CREATE_USER = gql`
  query CREATE_USER(
    $userId: String!
    $name: String!
  ) {
    createUser(
      userId: $userId
      name: $name
    ) {
      id
      entityName
      commitId
      committedAt
      version
    }
  }
`;
