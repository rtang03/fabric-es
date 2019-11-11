import gql from 'graphql-tag';

// prettier-ignore
export const DOCUMENT_ETCPO_BY_ID = gql`
  query DOCUMENT_ETCPO_BY_ID($id: ID!) {
    getDocumentById(id: $id) {
      documentId
      ownerId
      tradeId
      title
      description
      link
      etcPo {
        body
      }
      trade {
        title
        description
      }
    }
  }
`;
