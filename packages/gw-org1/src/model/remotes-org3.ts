import { GET_CONTENTS_BY_ID, GET_DETAILS_BY_ID, RemoteData } from '@espresso/model-loan-private';
import gql from 'graphql-tag';

export const remoteTypeDefs = gql`
  type Org3MSP_LoanDetails @key(fields: "loanId") {
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
    LoanDetail from org3
    """
    Org3MSP_details(token: String): Org3MSP_LoanDetails
  }

  type Org3MSP_DocContents @key(fields: "documentId") {
    documentId: String!
    content: Docs!
    timestamp: String!
    document: Document
  }

  union Docs = Data | File

  type Data {
    body: String!
  }

  type File {
    format: String!
    link: String!
  }

  extend type Document @key(fields: "documentId") {
    documentId: String! @external
    """
    DocContents from org3
    """
    Org3MSP_contents(token: String): Org3MSP_DocContents
  }
`;

export const remoteResolvers = {
  Loan: {
    Org3MSP_details: async ({ loanId }, { token }, { remoteData }: RemoteData) => {
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
  Document: {
    Org3MSP_contents: async ({ documentId }, { token }, { remoteData }: RemoteData) => {
      return remoteData({
        query: GET_CONTENTS_BY_ID,
        operationName: 'GetDocContentsById',
        variables: { documentId },
        token
      }).then(({ data }) => data?.getDocContentsById);
    }
  },
  DocContents: {
    document: ({ documentId }) => ({ __typename: 'Document', documentId })
  },
  Docs: {
    __resolveType: (obj: any) => (obj?.body ? 'Data' : obj?.format ? 'File' : null)
  }
};