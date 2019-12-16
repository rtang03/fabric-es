import { RemoteData } from '@espresso/gw-node';
import { ApolloError } from 'apollo-server';
import gql from 'graphql-tag';

export const resolvers = {
  Loan: {
    _details: async ({ loanId }, _, { remoteData }: RemoteData) =>
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
        variables: { loanId }
      }).then(({ data, errors }) => {
        if (errors) throw new ApolloError(errors[0].message);
        return data?.getLoanDetailsById;
      })
  },
  LoanDetails: {
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  },
  LocalResponse: {
    __resolveType: obj =>
      obj?.commitId ? 'LocalCommit' : obj?.message ? 'LocalError' : {}
  }
};
