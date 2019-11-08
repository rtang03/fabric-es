import gql from 'graphql-tag';

// prettier-ignore
export const CREATE_TRADE = gql`
  query CREATE_TRADE(
    $tradeId: String!
    $userId: String!
    $title: String!
    $description: String!
  ) {
    createTrade(
      tradeId: $tradeId
      userId: $userId
      title: $title
      description: $description
    ) {
      id
      entityName
      commitId
      committedAt
      version
    }
  }
`;
