import gql from 'graphql-tag';

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument(
    $userId: String!
    $documentId: String!
    $loanId: String
    $title: String
    $reference: String
    $link: String
  ) {
    updateDocument(
      userId: $userId
      documentId: $documentId
      loanId: $loanId
      title: $title
      reference: $reference
      link: $link
    ) {
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
