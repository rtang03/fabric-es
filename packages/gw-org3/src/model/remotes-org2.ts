import { GET_DETAILS_BY_ID, RemoteData } from '@espresso/model-loan-private';
import gql from 'graphql-tag';

export const remoteTypeDefs = gql`
  type Org2MSP_LoanDetails @key(fields: "loanId") {
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

  type ContactInfo {
    salutation: String
    name: String!
    title: String
    phone: String!
    email: String!
  }

  type LoanRequester {
    registration: String!
    name: String!
    type: String
  }

  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    """
    LoanDetail from org2
    """
    Org2MSP_details(token: String): Org2MSP_LoanDetails
  }
`;

export const remoteResolvers = {
  Loan: {
    Org2MSP_details: async ({ loanId }, { token }, { remoteData }: RemoteData) => {
      return remoteData({
        query: GET_DETAILS_BY_ID,
        operationName: 'GetLoanDetailsById',
        variables: { loanId },
        token
      }).then(({ data }) => data?.getLoanDetailsById);
    }
  },
  LoanDetails: {
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  },
};