import gql from 'graphql-tag';

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument(
    $userId: String!
    $documentId: String!
    $loanId: String
    $title: String
    $reference: String!
    $link: String!
  ) {
    createDocument(userId: $userId, documentId: $documentId, loanId: $loanId, title: $title, reference: $reference, link: $link) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocError {
        message
      }
    }
  }
`;
