import gql from 'graphql-tag';

// prettier-ignore
export const USER_COMMITS = gql`
  query USER_COMMITS($id: String!) {
    getCommitByUserId(id: $id) {
      id
      entityName
      commitId
      committedAt
      version
      events {
        type
      }
    }
  }
`;
