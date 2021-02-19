import gql from 'graphql-tag';

export const GET_LOAN_BY_ID = gql`
  query GetLoanById($loanId: String!) {
    getLoanById(loanId: $loanId) {
      loanId
      ownerId
      description
      reference
      comment
      status
      timestamp
      documents {
        documentId
        title
        reference
        status
        timestamp
      }
      details {
        requester {
          registration
          name
          type
        }
        contact {
          salutation
          name
          title
          phone
          email
        }
        loanType
        startDate
        tenor
        currency
        requestedAmt
        approvedAmt
        comment
      }
    }
  }
`;
