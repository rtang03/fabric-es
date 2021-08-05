import gql from 'graphql-tag';

export const UPDATE_LOAN = gql`
  mutation UpdateLoan(
    $userId: String!
    $loanId: String!
    $reference: String
    $description: String
    $comment: String
  ) {
    updateLoan(
      userId: $userId
      loanId: $loanId
      reference: $reference
      description: $description
      comment: $comment
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
