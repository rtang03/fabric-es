import gql from 'graphql-tag';

export const typeDefs = gql`
extend type Query {
  getCommitsByLoanId(loanId: String!): [LoanCommit]!
  getLoanById(loanId: String!): Loan
}

type Mutation {
  applyLoan(
    userId: String!,
    loanId: String!,
    description: String,
    reference: String!
  ): LoanResponse
  cancelLoan(userId: String!, loanId: String!): LoanResponse
  approveLoan(userId: String!, loanId: String!): LoanResponse
  returnLoan(userId: String!, loanId: String!): LoanResponse
  rejectLoan(userId: String!, loanId: String!): LoanResponse
  expireLoan(userId: String!, loanId: String!): LoanResponse
  updateLoan(
    userId: String!
    loanId: String!
    description: String
    reference: String
  ): [LoanResponse]!
}

type Loan @key(fields: "loanId") {
  loanId: String!
  ownerId: String!
  description: String
  reference: String!
  status: Int!
  timestamp: String!
}

union LoanResponse = LoanCommit | LoanError

type LoanEvent {
  type: String
}

type LoanCommit {
  id: String
  entityName: String
  version: Int
  commitId: String
  committedAt: String
  entityId: String
  events: [LoanEvent!]
}

type LoanError {
  message: String!
  stack: String
}
`;
