import gql from 'graphql-tag';

// prettier-ignore
export const CREATE_ETCPO = gql`
  query CREATE_ETCPO(
    $id: String!
    $userId: String!
    $body: String!
  ) {
    createEtcPo(
      id: $id
      userId: $userId
      body: $body
    ) {
      id
      entityName
      commitId
      committedAt
      version
    }
  }
`;
