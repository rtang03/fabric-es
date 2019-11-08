import gql from 'graphql-tag';

// prettier-ignore
export const SUBSCRIBE_USERS = gql`
  subscription SUBSCRIBE_USERS(
    $entityName: String!,
    $event: [String!]!,
  ) {
    toUsers(
      entityName: $entityName, 
      event: $event,
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
