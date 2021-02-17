import gql from 'graphql-tag';

export const GET_DOCUMENT_BY_PAGE = gql`
  query GetDocumentsByPage($pageSize: Int) {
    getPaginatedDocuments(pageSize: $pageSize) {
      total
      hasMore
      entities {
        documentId
        ownerId
        loanId
        title
        reference
        status
        timestamp
      }
    }
  }
`;
