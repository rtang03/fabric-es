import gql from 'graphql-tag';

// prettier-ignore
export const PAGINATED_DOCUMENT = gql`
  query PAGINATED_DOCUMENT(
    $cursor: Int!
  ) {
    getPaginatedDocument(
      cursor: $cursor
    ) {
      total
      hasMore
      entities {
        documentId
        ownerId
        tradeId
        title
        description
        link
      }
    }
  }
`;
