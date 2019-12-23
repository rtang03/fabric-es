import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    getLoanDetailsById(loanId: String!): LoanDetails!
  }

  type Mutation {
    createLoanDetails(
      userId: String!,
      loanId: String!,
      requester: LoanRequesterInput!,
      contact: ContactInfoInput!,
      loanType: String,
      startDate: String!,
      tenor: Int!,
      currency: String!,
      requestedAmt: Float!,
      approvedAmt: Float,
      comment: String
    ): LocalResponse
    updateLoanDetails(
      userId: String!,
      loanId: String!,
      requester: LoanRequesterInput,
      contact: ContactInfoInput,
      loanType: String,
      startDate: String,
      tenor: Int,
      currency: String,
      requestedAmt: Float,
      approvedAmt: Float,
      comment: String
    ): [LocalResponse]!
  }

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

  input LoanRequesterInput {
    registration: String
    name: String
    type: String
  }
  type LoanRequester {
    registration: String!
    name: String!
    type: String
  }

  input ContactInfoInput {
    salutation: String
    name: String
    title: String
    phone: String
    email: String
  }
  type ContactInfo {
    salutation: String
    name: String!
    title: String
    phone: String!
    email: String!
  }

  ###
  # Mutation responses
  ###
  union LocalResponse = LocalCommit | LocalError

  type LocalCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
  }

  type LocalError {
    message: String!
    stack: String
  }

  ###
  # Federated types
  ###
  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    details: LoanDetails
  }
`;