import gql from 'graphql-tag';

// prettier-ignore
export const TRADES = gql`
  query TRADES {
    getAllTrade {
      tradeId
      title
      description
    }
  }
`;
