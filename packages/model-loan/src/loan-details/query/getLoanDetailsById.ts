import gql from 'graphql-tag';

export const GET_LOAN_DETAILS_BY_ID = gql`
  query GetLoanDetailsById($loanId: String!) {
    getLoanDetailsById(loanId: $loanId) {
      loanId
      loan {
        ownerId
        description
        reference
        status
        timestamp
      }
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
      timestamp
    }
  }
`;
