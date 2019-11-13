import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    getCommitsByLoanId(loanId: String!): [LocalCommit]!
    getLoanDetailsById(id: String!): LoanDetails!
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
    ): LoanDetails
  }

  type LoanDetails @key(fields: "loanId") {
    loanId: String!
    requester: LoanRequester!
    contact: ContactInfo!
    lonaType: String
    startDate: String!
    tenor: Int!
    currency: String!
    requestedAmt: Float!
    approvedAmt: Float
    comment: String
    timestamp: String!
  }

  input LoanRequesterInput {
    registration: String!
    name: String!
    type: String
  }
  type LoanRequester {
    registration: String!
    name: String!
    type: String
  }

  input ContactInfoInput {
    salutation: String
    name: String!
    title: String
    phone: String!
    email: String!
  }
  type ContactInfo {
    salutation: String
    name: String!
    title: String
    phone: String!
    email: String!
  }

  type LocalCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
  }
`;

// extend type Document @key(fields: "documentId") {
//   documentId: String! @external
//   etcPo: EtcPo
// }
