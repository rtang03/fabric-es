import gql from 'graphql-tag';

// prettier-ignore
export const DOCUMENT_COMMITS = gql`
  query DOCUMENT_COMMITS($id: String!) {
    getCommitByDocumentId(id: $id) {
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
