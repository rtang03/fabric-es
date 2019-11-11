import gql from 'graphql-tag';

export const typeDefs = gql`
type Query {
  getCommitsByLoanId(loanId: String!): [LoanCommit]!
  getLoanById(loanId: String!): Loan
}

type Mutation {
  applyLoan(
    userId: String!
    loanId: String!
    description: String
    reference: String!
    loaner: String!
  ): LoanCommit
  cancelLoan(userId: String!, loanId: String!): LoanCommit
  approveLoan(userId: String!, loanId: String!): LoanCommit
  returnLoan(userId: String!, loanId: String!): LoanCommit
  rejectLoan(userId: String!, loanId: String!): LoanCommit
  expireLoan(userId: String!, loanId: String!): LoanCommit
}

type Loan @key(fields: "loanId") {
  loanId: String!
  ownerId: String!
  description: String
  reference: String!
  loaner: String!
  status: String!
  timestamp: String!
}

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
`;
