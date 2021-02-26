import { Commit } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { ApolloError } from 'apollo-server-errors';
import { loanDetailsCommandHandler } from '..';
import type { LoanDetailsContext, LoanDetails } from '..';

const logger = getLogger('loan-details/typeDefs.js');

export const resolvers = {
  Query: {
    getLoanDetailsById: catchResolverErrors(
      async (
        _,
        { loanId },
        { dataSources: { loanDetails }, username }: LoanDetailsContext
      ): Promise<LoanDetails> =>
        loanDetails.repo
          .getById({ id: loanId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'getLoanDetailsById', logger, useAuth: false }
    ),
  },
  Mutation: {
    createLoanDetails: catchResolverErrors(
      async (
        _,
        {
          userId,
          loanId,
          requester,
          contact,
          loanType,
          startDate,
          tenor,
          currency,
          requestedAmt,
          approvedAmt,
          comment,
        },
        { dataSources: { loanDetails }, username }: LoanDetailsContext
      ): Promise<Commit> =>
        loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        }).CreateLoanDetails({
          userId,
          payload: {
            loanId,
            requester,
            contact,
            loanType,
            startDate,
            tenor,
            currency,
            requestedAmt,
            approvedAmt,
            comment,
            timestamp: Date.now(),
          },
        }),
      { fcnName: 'createLoanDetails', logger, useAuth: true }
    ),
    updateLoanDetails: async (
      _,
      {
        userId,
        loanId,
        requester,
        contact,
        loanType,
        startDate,
        tenor,
        currency,
        requestedAmt,
        approvedAmt,
        comment,
      },
      { dataSources: { loanDetails }, username }: LoanDetailsContext
    ): Promise<Commit[] | { error: any }> => {
      // TODO: any[] is wrong typing, need fixing
      const result: any[] = [];

      if (typeof requester !== 'undefined' && Object.keys(requester).length > 0) {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        })
          .DefineLoanRequester({
            userId,
            payload: { loanId, requester, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof contact !== 'undefined' && Object.keys(contact).length > 0) {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        })
          .DefineLoanContact({
            userId,
            payload: { loanId, contact, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof loanType !== 'undefined') {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        })
          .DefineLoanType({
            userId,
            payload: { loanId, loanType, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof startDate !== 'undefined') {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        })
          .DefineLoanStartDate({
            userId,
            payload: { loanId, startDate, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof tenor !== 'undefined') {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        })
          .DefineLoanTenor({
            userId,
            payload: { loanId, tenor, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof currency !== 'undefined') {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        })
          .DefineLoanCurrency({
            userId,
            payload: { loanId, currency, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof requestedAmt !== 'undefined') {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        })
          .DefineLoanRequestedAmt({
            userId,
            payload: { loanId, requestedAmt, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof approvedAmt !== 'undefined') {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        })
          .DefineLoanApprovedAmt({
            userId,
            payload: { loanId, approvedAmt, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof comment !== 'undefined') {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: loanDetails.repo,
        })
          .DefineLoanDtlComment({
            userId,
            payload: { loanId, comment, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      return result;
    },
  },
  Loan: {
    details: catchResolverErrors(
      async ({ loanId }, _, { dataSources: { loanDetails }, username }: LoanDetailsContext) =>
        loanDetails.repo
          .getById({ id: loanId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'Loan/details', logger, useAuth: false }
    ),
  },
  LoanDetails: {
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId }),
  },
  LoanDetailsResp: {
    __resolveType: (obj) =>
      obj.commitId ? 'LoanDetailsCommit' : obj.message ? 'LoanDetailsError' : {},
  },
};
