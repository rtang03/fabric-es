import { Commit } from '@espresso/fabric-cqrs';
import { LoanDetails, loanDetailsCommandHandler } from './domain';

export const resolvers = {
  Query: {
    getCommitsByLoanId: async (_, { loanId }, { dataSources: { dtlsDataSource }}): Promise<Commit[] | { error: any }> =>
      dtlsDataSource.repo.getCommitById(loanId)
        .then(({ data }) => data || [])
        .catch(error => ({ error })),
    getLoanDetailsById: async (_, { loanId }, { dataSources: { dtlsDataSource }}): Promise<LoanDetails | { error: any }> =>
      dtlsDataSource.repo.getById({ id: loanId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    createLoanDetails: async (_, {
      userId, loanId, requester, contact, loanType, startDate, tenor, currency, requestedAmt, approvedAmt, comment
    }, {
      dataSources: { dtlsDataSource }, enrollmentId
    }): Promise<Commit> =>
      loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: dtlsDataSource.repo }).CreateLoanDetails({
        userId,
        payload: { loanId, requester, contact, loanType, startDate, tenor, currency, requestedAmt, approvedAmt, comment, timestamp: Date.now() }
      })
  },
  LoanDetails: {
    __resolveReference: ({ loanId }, { dataSources: { dtlsDataSource }}) =>
      dtlsDataSource.repo.getById({ id: loanId })
        .then(({ currentState }) => currentState)
  }
};
