import { RemoteData } from '@espresso/gw-node';
import gql from 'graphql-tag';
import { GET_DETAILS_BY_ID } from '.';

export const typeDefs = gql`
  ###
  # Local Type: Loan Details
  ###
  type _LoanDetails @key(fields: "loanId") {
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
    _details: _LoanDetails
  }
`;

export const resolvers = {
  Loan: {
    _details: async ({ loanId }, { uri, token }, { remoteData }: RemoteData) => {
      return remoteData({
        uri,
        query: GET_DETAILS_BY_ID,
        operationName: 'GetLoanDetailsById',
        variables: { loanId },
        token
      }).then(({ data }) => data?.getLoanDetailsById);
    }
  },
  LoanDetails: {
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  }
};