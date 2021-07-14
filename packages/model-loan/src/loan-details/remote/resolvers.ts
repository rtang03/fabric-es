import { catchResolverErrors, getLogger, queryRemoteData } from '@fabric-es/gateway-lib';
import { GET_DETAILS_BY_ID } from '..';
import { LoanDetails } from '../domain';

const logger = getLogger('loan-details/remotes.js');

export const resolvers = {
  Loan: {
    details: catchResolverErrors(
      async ({ loanId }, _, context) =>
        queryRemoteData(
          LoanDetails, {
            id: loanId,
            context,
            query: GET_DETAILS_BY_ID,
          }),
      { fcnName: 'Loan/details/remote', logger, useAuth: false }
    ),
  },
  LoanDetails: {
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  }
};
