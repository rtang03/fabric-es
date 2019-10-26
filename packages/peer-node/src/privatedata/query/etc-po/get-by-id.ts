import gql from 'graphql-tag';

// prettier-ignore
export const ETCPO_BY_ID = gql`
  query ETCPO_BY_ID($id: String!) {
    getEtcPoById(id: $id) {
      id
      ownerId
      body
      document {
        tradeId
        title
      }
    }
  }
`;
