import gql from 'graphql-tag';

export const GET_COMMITS_BY_USER = gql`
  query GetCommitsByUser($userId: String!) {
    getCommitsByUserId(userId: $userId) {
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
