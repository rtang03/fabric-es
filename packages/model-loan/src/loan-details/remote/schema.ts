import gql from 'graphql-tag';

/*
NOTE!!! This is the type definition publish by an ORG, who has certain private-data to share to other ORGs.
An ORG wants to access this private-data need to run a federated Apollo server behind its gateway using this
type definition.
*/
export const typeDefs = gql`
  ###
  # Local Type: Loan Details
  ###
  type LoanDetails @key(fields: "loanId") {
    loanId: String!
    requester: LoanRequester!
    contact: ContactInfo!
    loanType: String
    startDate: String!
    tenor: Int!
    currency: String!
    requestedAmt: Float!
    approvedAmt: Float
    comment: String
    timestamp: String!
    loan: Loan
  }

  type LoanRequester {
    registration: String!
    name: String!
    type: String
  }

  type ContactInfo {
    salutation: String
    name: String!
    title: String
    phone: String!
    email: String!
  }

  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    details: [LoanDetails]
  }
`;
