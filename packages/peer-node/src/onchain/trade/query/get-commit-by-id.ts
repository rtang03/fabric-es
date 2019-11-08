import gql from 'graphql-tag';

// prettier-ignore
export const TRADE_COMMITS = gql`
  query TRADE_COMMITS($id: String!) {
    getCommitByTradeId(id: $id) {
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
