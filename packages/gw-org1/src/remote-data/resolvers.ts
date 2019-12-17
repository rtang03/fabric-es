import { RemoteData } from '@espresso/gw-node';
import gql from 'graphql-tag';
import { Resolvers } from '../generated/remotedata-resolvers';

export const resolvers: Resolvers = {
  Loan: {
    _details: async ({ loanId }, { token }, { remoteData }: RemoteData) =>
      remoteData({
        query: gql`
          query GetLoanDetailsById($loanId: String!) {
            getLoanDetailsById(loanId: $loanId) {
              loanId
              requester {
                registration
                name
                type
              }
              contact {
                salutation
                name
                title
                phone
                email
              }
              loanType
              startDate
              tenor
              currency
              requestedAmt
              approvedAmt
              comment
              timestamp
            }
          }
        `,
        operationName: 'GetLoanDetailsById',
        variables: { loanId },
        token
      }).then(({ data }) => data?.getLoanDetailsById)
  },
  LoanDetails: {
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  }
};
