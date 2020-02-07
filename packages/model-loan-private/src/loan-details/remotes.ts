import { RemoteData } from '@espresso/gw-node';
import gql from 'graphql-tag';
import { GET_DETAILS_BY_ID } from '.';
import { UriResolver } from '../uriResolver';

/*
NOTE!!! This is the type definition publish by an ORG, who has certain private-data to share to other ORGs.
An ORG wants to access this private-data need to run a federated Apollo server behind its gateway using this
type definition.
*/
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
    _details: async ({ loanId }, { token }, { remoteData }: RemoteData) => {
      console.log('HHHHHiii', loanId, UriResolver[loanId]);
      return remoteData({
        uri: UriResolver[loanId],
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