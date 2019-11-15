import { Commit } from '@espresso/fabric-cqrs';
import { LoanDetails, loanDetailsCommandHandler } from '.';

export const resolvers = {
  Query: {
    getLoanDetailsById: async (_, { loanId }, { dataSources: { loanDetailsDataSource }}): Promise<LoanDetails | { error: any }> =>
      loanDetailsDataSource.repo.getById({ id: loanId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    createLoanDetails: async (
      _, { userId, loanId, requester, contact, loanType, startDate, tenor, currency, requestedAmt, approvedAmt, comment }, {
      dataSources: { loanDetailsDataSource }, enrollmentId
    }): Promise<Commit> =>
      loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).CreateLoanDetails({
        userId,
        payload: { loanId, requester, contact, loanType, startDate, tenor, currency, requestedAmt, approvedAmt, comment, timestamp: Date.now() }
      })
  },
  LoanDetails: {
    loan(details) {
      return { __typename: 'Loan', loanId: details.loanId };
    }
  }
};
