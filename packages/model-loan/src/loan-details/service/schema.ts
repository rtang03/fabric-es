import gql from 'graphql-tag';

export const typeDefs = gql`
  """
  @schema The **LOAN DETAILS** schema provides the facilities to manage and manipulate the privte chain entity **LoanDetails**, which
  contains the detail information of a particular loan request, accessable only under permission.
  """

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

  """
  @Primary **LoanDetails** contains the detail information of a particular loan request on the private-chain, not suppose to be globally accessible.
  """
  type LoanDetails @key(fields: "loanId") {
    loanId: String!

    "Requester of the loan"
    requester: LoanRequester!

    "Contact information of the requester"
    contact: ContactInfo!

    "Type of loans, free text"
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
  "Requester of the loan"
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
  "Contact information of the requester"
  type ContactInfo {
    salutation: String
    name: String!
    title: String
    phone: String!
    email: String!
  }

  "Response from _mutation_ (create, update, delete) operations related to the **LoanDetails** type"
  union PrvResponse = PrvCommit | SrvError

  "Place holder for the actual private chain data structure of **LoanDetails**"
  type PrvCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    mspId: String
    entityId: String
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
