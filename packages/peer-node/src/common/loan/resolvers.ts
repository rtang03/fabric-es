import { Loan, loanCommandHandler } from '@espresso/common';
import { Commit } from '@espresso/fabric-cqrs';

export const resolvers = {
  Query: {
    getCommitsByLoanId: async (_, { loanId }, { dataSources: { loanDataSource }}): Promise<Commit[] | { error: any }> =>
      loanDataSource.repo.getCommitById(loanId)
        .then(({ data}) => data || [])
        .catch(error => ({ error })),
    getLoanById:  async (_, { loanId }, { dataSources: { loanDataSource }}): Promise<Loan | { error: any }> =>
      loanDataSource.repo.getById({ id: loanId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    applyLoan: async (
      _,
      { userId, loanId, description, reference, loaner },
      { dataSources: { loanDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, userRepo: userDataSource.repo, loanRepo: loanDataSource.repo }).ApplyLoan({
        userId,
        payload: { loanId, description, reference, loaner, timestamp: Date.now() }
      })
  },
  Loan: {
    __resolveReference: ({ loanId }, { dataSources: { loanDataSource }}) =>
      loanDataSource.repo.getById({ id: loanId })
        .then(({ currentState }) => currentState)
  }
};
