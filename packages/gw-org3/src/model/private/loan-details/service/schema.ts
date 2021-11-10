import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    getLoanDetailsById(loanId: String!): LoanDetails
  }

  type Mutation {
    createLoanDetails(
      userId: String!
      loanId: String!
      requester: LoanRequesterInput!
      contact: ContactInfoInput!
      loanType: String
      startDate: String!
      tenor: Int!
      currency: String!
      requestedAmt: Float!
      approvedAmt: Float
      comment: String
    ): PrvResponse
    updateLoanDetails(
      userId: String!
      loanId: String!
      requester: LoanRequesterInput
      contact: ContactInfoInput
      loanType: String
      startDate: String
      tenor: Int
      currency: String
      requestedAmt: Float
      approvedAmt: Float
      comment: String
    ): [PrvResponse]!
  }

  "@Primary Customized local type: Loan Details"
  type LoanDetails @key(fields: "loanId") {
    loanId: String!
    requester: LoanRequester!

    "Data field with customized field"
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
    company: String
  }
  type ContactInfo {
    salutation: String
    name: String!
    title: String
    phone: String!
    email: String!

    "Customized data field"
    company: String
  }

  type Event {
    type: String
  }

  ###
  # Mutation responses
  ###
  union PrvResponse = PrvCommit | SrvError

  type PrvCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    mspId: String
    entityId: String
    events: [Event!]
  }

  type SrvError {
    message: String!
    stack: String
  }

  ###
  # Federated types
  ###
  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    details: [LoanDetails]
  }
`;
