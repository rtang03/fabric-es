import gql from 'graphql-tag';
import { RemoteData } from '.';
import { GET_CONTENTS_BY_ID, GET_DETAILS_BY_ID } from './queries';

export const remoteTypeDefs = gql`
  """
  This is a sample implementation. The Underscores (_) should be replaced with the Org's MSP ID
  """

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
    Remote LoanDetails
    """
    _details(token: String): _LoanDetails
  }

  type _DocContents @key(fields: "documentId") {
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
    Remote DocContents
    """
    _contents(token: String): _DocContents
  }
`;

export const remoteResolvers = {
  Loan: {
    _details: async ({ loanId }, { token }, { remoteData }: RemoteData) => {
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
    _contents: async ({ documentId }, { token }, { remoteData }: RemoteData) => {
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