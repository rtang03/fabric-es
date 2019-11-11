import gql from 'graphql-tag';

// prettier-ignore
export const DOCUMENTS = gql`
  query DOCUMENTS {
    getAllDocument {
      documentId
      ownerId
      tradeId
      title
      description
      link
    }
  }
`;
