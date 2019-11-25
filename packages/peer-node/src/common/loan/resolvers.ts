import { Loan, loanCommandHandler } from '@espresso/common';
import { Commit } from '@espresso/fabric-cqrs';

export const resolvers = {
  Query: {
    getCommitsByLoanId: async (_, { loanId }, { dataSources: { loanDataSource }}): Promise<Commit[] | { error: any }> =>
      loanDataSource.repo.getCommitById(loanId)
        .then(({ data }) => data || [])
        .catch(error => ({ error })),
    getLoanById:  async (_, { loanId }, { dataSources: { loanDataSource }}): Promise<Loan | { error: any }> =>
      loanDataSource.repo.getById({ id: loanId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    applyLoan: async (
      _, { userId, loanId, description, reference }, { dataSources: { loanDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, userRepo: userDataSource.repo, loanRepo: loanDataSource.repo }).ApplyLoan({
        userId,
        payload: { loanId, description, reference, timestamp: Date.now() }
      }),
    cancelLoan: async (
      _, { userId, loanId }, { dataSources: { loanDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, userRepo: userDataSource.repo, loanRepo: loanDataSource.repo }).CancelLoan({
        userId, payload: { loanId, timestamp: Date.now() }
      }),
    approveLoan: async (
      _, { userId, loanId }, { dataSources: { loanDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, userRepo: userDataSource.repo, loanRepo: loanDataSource.repo }).ApproveLoan({
        userId, payload: { loanId, timestamp: Date.now() }
      }),
    returnLoan: async (
      _, { userId, loanId }, { dataSources: { loanDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, userRepo: userDataSource.repo, loanRepo: loanDataSource.repo }).ReturnLoan({
        userId, payload: { loanId, timestamp: Date.now() }
      }),
    rejectLoan: async (
      _, { userId, loanId }, { dataSources: { loanDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, userRepo: userDataSource.repo, loanRepo: loanDataSource.repo }).RejectLoan({
        userId, payload: { loanId, timestamp: Date.now() }
      }),
    expireLoan: async (
      _, { userId, loanId }, { dataSources: { loanDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, userRepo: userDataSource.repo, loanRepo: loanDataSource.repo }).ExpireLoan({
        userId, payload: { loanId, timestamp: Date.now() }
      }),
    updateLoan: async (
      _, { userId, loanId, description, reference }, { dataSources: { loanDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit[] | { error: any }> => {
      const result: Commit[] = [];
      if (reference) {
        const c = await loanCommandHandler({ enrollmentId, userRepo: userDataSource.repo, loanRepo: loanDataSource.repo }).DefineLoanReference({
          userId, payload: { loanId, reference, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (description) {
        const c = await loanCommandHandler({ enrollmentId, userRepo: userDataSource.repo, loanRepo: loanDataSource.repo }).DefineLoanDescription({
          userId, payload: { loanId, description, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      return result;
    }
  },
  Loan: {
    __resolveReference: ({ loanId }, { dataSources: { loanDataSource }}): Promise<Loan> => {
      // console.log('peer-node/loan/resolvers.ts - Loan: __resolveReference:', `loanId: ${loanId}`);
      return loanDataSource.repo.getById({ id: loanId })
        .then(({ currentState }) => currentState);
    }
  },
  LoanResponse: {
    __resolveType(obj, _, __) {
      if (obj.commitId) {
        return 'LoanCommit';
      }
      if (obj.message) {
        return 'LoanError';
      }
      return {};
    }
  }
};
