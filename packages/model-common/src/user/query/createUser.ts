import gql from 'graphql-tag';

export const CREATE_USER = gql`
  mutation CreateUser($name: String!, $userId: String!) {
    createUser(name: $name, userId: $userId) {
      ... on UserCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on UserError {
        message
      }
    }
  }
`;
