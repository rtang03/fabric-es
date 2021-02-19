import gql from 'graphql-tag';

export const GET_DETAILS_BY_ID = gql`
  query GetLoanDetailsById($loanId: String!) {
    getLoanDetailsById(loanId: $loanId) {
      loanId
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
`;
