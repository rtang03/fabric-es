import gql from 'graphql-tag';

// prettier-ignore
export const SUBSCRIBE_USER = gql`
  subscription SUBSCRIBE_USER(
    $entityName: String!,
    $event: [String!]!,
    $id: String!
  ) {
    toUser(
      entityName: $entityName, 
      event: $event,
      id: $id
    ) {
      __typename
      id
      commitId
      committedAt
      entityId
      entityName
      version
    }
  }
`;
