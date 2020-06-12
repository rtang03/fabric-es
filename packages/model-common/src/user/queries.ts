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

export const GET_USER_BY_ID = gql`
  query GetUserById($userId: String!) {
    getUserById(userId: $userId) {
      userId
      name
      mergedUserIds
    }
  }
`;
