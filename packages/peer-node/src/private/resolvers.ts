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
      }),
    updateLoanDetails: async (
      _, { userId, loanId, requester, contact, loanType, startDate, tenor, currency, requestedAmt, approvedAmt, comment }, {
        dataSources: { loanDetailsDataSource }, enrollmentId
    }): Promise<Commit[] | { error: any }> => {
      const result: Commit[] = [];
      if (requester && (Object.keys(requester).length > 0)) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).DefineLoanRequester({
          userId, payload: { loanId, requester, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (contact && (Object.keys(contact).length > 0)) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).DefineLoanContact({
          userId, payload: { loanId, contact, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (loanType) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).DefineLoanType({
          userId, payload: { loanId, loanType, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (startDate) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).DefineLoanStartDate({
          userId, payload: { loanId, startDate, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (tenor) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).DefineLoanTenor({
          userId, payload: { loanId, tenor, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (currency) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).DefineLoanCurrency({
          userId, payload: { loanId, currency, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (requestedAmt) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).DefineLoanRequestedAmt({
          userId, payload: { loanId, requestedAmt, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (approvedAmt) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).DefineLoanApprovedAmt({
          userId, payload: { loanId, approvedAmt, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (comment) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetailsDataSource.repo }).DefineLoanComment({
          userId, payload: { loanId, comment, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      return result;
    }
  },
  LoanDetails: {
    loan(details) {
      return { __typename: 'Loan', loanId: details.loanId };
    }
  },
  LocalResponse: {
    __resolveType(obj, _, __) {
      if (obj.commitId) {
        return 'LocalCommit';
      }
      if (obj.message) {
        return 'LocalError';
      }
      return {};
    }
  }
};
