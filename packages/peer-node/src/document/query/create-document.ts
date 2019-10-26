import gql from 'graphql-tag';

// prettier-ignore
export const CREATE_DOCUMENT = gql`
  query CREATE_DOCUMENT(
    $documentId: String!
    $tradeId: String!
    $userId: String!
    $title: String!
    $description: String!
    $link: String!
  ) {
    createDocument(
      documentId: $documentId
      tradeId: $tradeId
      userId: $userId
      title: $title
      link: $link
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
