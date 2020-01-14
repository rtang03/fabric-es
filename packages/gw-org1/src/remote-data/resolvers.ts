import { RemoteData } from '@espresso/gw-node';
import Client from 'fabric-client';
import gql from 'graphql-tag';
import { Resolvers } from '../generated/remotedata-resolvers';

export const resolvers: Resolvers = {
  Loan: {
    _details: async ({ loanId }, { token }, { remoteData }: RemoteData) => {
      const logger = Client.getLogger('remote-data.resolvers.js');

      return remoteData({
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
      }).then(({ data }) => {
        logger.info(`getLoanDetailsById succeed: ${loanId}`);
        return data?.getLoanDetailsById;
      });
    }
  },
  LoanDetails: {
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  }
};
