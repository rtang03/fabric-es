import gql from 'graphql-tag';

export const typeDefs = gql`
  """
  @schema The **LOAN** schema provides the facilities to manage and manipulate the top-level public chain entity **Loan**, which
  serve as the anchor of all the related information of a particular loan request without revealing any non-public information.
  """

  type Query {
    "@Skip"
    getCommitsByLoanId(loanId: String!): [PubCommit]!

    "Get loan by id from the query handler"
    getLoanById(loanId: String!): Loan

    "List all loans in a paginated manner"
    getPaginatedLoans(cursor: Int, pageSize: Int = 10): PaginatedLoans!

    "Search loan by field(s) from the query handler"
    searchLoanByFields(
      "Syntax: JSON \`{ [field name 1] = [value 1], [field name 2] = [value 2], ... }\`"
      where: String!
    ): [Loan]

    "Search loans by text"
    searchLoanContains(contains: String!): [Loan]

    "Full text search of loans"
    searchLoan(
      query: String!
      params: String
      cursor: Int
      pageSize: Int = 10
    ): PaginatedLoans
  }

  type Mutation {
    applyLoan(
      userId: String!
      loanId: String!
      description: String!
      reference: String!
      comment: String
    ): PubResponse

    "Update one or more updatable field(s) in a **Loan** identified by the *userId* and *loanId*"
    updateLoan(
      userId: String!
      loanId: String!
      description: String
      "NOTE: reference is non-updatable, included here for completeness sake, and as an example"
      reference: String
      comment: String
    ): [PubResponse]!

    cancelLoan(userId: String!, loanId: String!): PubResponse

    approveLoan(userId: String!, loanId: String!): PubResponse

    "Mark a loan as \`returned to applicant, request additional information\`"
    returnLoan(userId: String!, loanId: String!): PubResponse

    "Mark a loan as \`rejected by the lender\`"
    rejectLoan(userId: String!, loanId: String!): PubResponse

    "Mark a loan as \`expired\`"
    expireLoan(userId: String!, loanId: String!): PubResponse
  }

  """
  @Primary **Loan** is one of the top-level on-chain entities. Being globally accessible, it serves as the anchor of all information related to
  a particular loan request found among the participating organizations. Each loan is uniquely identified by a *loanId*.
  The loan applicants may also utilize the *reference* property as an external identifier unique within the applicant's individual organizations.
  """
  type Loan @key(fields: "loanId") {
    loanId: String!

    ownerId: String!

    description: String!

    "External unique reference of the loan"
    reference: String!

    comment: String

    status: Int!

    "@Skip"
    timestamp: String!
  }

  "For querying multiple loans in pages"
  type PaginatedLoans {
    items: [Loan!]!
    total: Int!
    hasMore: Boolean!
  }

  "Response from _mutation_ (create, update, delete) operations related to the **Loan** type"
  union PubResponse = PubCommit | SrvError

  "@Skip"
  type Event {
    type: String
  }

  "Place holder for the actual on-chain data structure of loans"
  type PubCommit {
    id: String

    entityName: String

    version: Int

    "Timestamp - may not be sufficient. TODO: change to use UUID"
    commitId: String

    mspId: String

    entityId: String

    events: [Event!]
  }

  "@Skip"
  type SrvError {
    message: String!
    stack: String
  }
`;
