import gql from 'graphql-tag';

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument(
    $userId: String!
    $documentId: String!
    $loanId: String
    $title: String
    $reference: String
  ) {
    updateDocument(
      userId: $userId
      documentId: $documentId
      loanId: $loanId
      title: $title
      reference: $reference
    ) {
      ... on PubCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on SrvError {
        message
      }
    }
  }
`;
