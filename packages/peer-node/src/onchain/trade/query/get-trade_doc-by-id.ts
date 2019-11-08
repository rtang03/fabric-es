import gql from 'graphql-tag';

// prettier-ignore
export const TRADE_DOC_BY_ID = gql`
  query TRADE_BY_ID($id: ID!) {
    getTradeById(id: $id) {
      tradeId
      title
      description
      documents {
        documentId
        title
        description
      }
    }
  }
`;
