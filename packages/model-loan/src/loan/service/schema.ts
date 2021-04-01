import gql from 'graphql-tag';

export const typeDefs = gql`
  """
  @schema Schema level comment for LOAN!
  """

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

  """
  *Loan* is one of the on-chain top-level entities. Being globally accessible, it serves as an anchor point of all information related
  to a loan request scattered among the participating organizations. Each loan is uniquely identified by a _loanId_. The
  loan applicants may also utilize the _reference_ property as their internal identifier unique within their individual organizations.
  """
  type Loan @key(fields: "loanId") {
    loanId: String!
    ownerId: String!
    description: String!
    reference: String!
    comment: String
    status: Int!
    timestamp: String!
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
