import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    getCommitsByLoanId(loanId: String!): [LoanCommit]!
    getLoanById(loanId: String!): Loan
    getPaginatedLoans(cursor: Int, pageSize: Int = 10): PaginatedLoans!
    searchLoanByFields(where: String!): [Loan]
    searchLoanContains(contains: String!): [Loan]
  }

  type Mutation {
    applyLoan(
      userId: String!
      loanId: String!
      description: String!
      reference: String!
      comment: String
    ): LoanResponse
    updateLoan(
      userId: String!
      loanId: String!
      description: String
      reference: String
      comment: String
    ): [LoanResponse]!
    cancelLoan(userId: String!, loanId: String!): LoanResponse
    approveLoan(userId: String!, loanId: String!): LoanResponse
    returnLoan(userId: String!, loanId: String!): LoanResponse
    rejectLoan(userId: String!, loanId: String!): LoanResponse
    expireLoan(userId: String!, loanId: String!): LoanResponse
  }

  type Loan @key(fields: "loanId") {
    loanId: String!
    ownerId: String!
    description: String!
    reference: String!
    comment: String
    status: Int!
    timestamp: String!
    _organization: [String]!
  }

  type PaginatedLoans {
    items: [Loan!]!
    total: Int!
    hasMore: Boolean!
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
    mspId: String
    entityId: String
    events: [LoanEvent!]
  }

  type LoanError {
    message: String!
    stack: String
  }
`;
