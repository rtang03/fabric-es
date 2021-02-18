import type { Commit } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { loanDetailsResolvers } from '@fabric-es/model-loan';
import { ApolloError } from 'apollo-server-errors';
import { loanDetailsCommandHandler } from './domain';
import type { LoadDetailsContext } from './types';

const logger = getLogger('document/typeDefs.js');

export const resolvers = {
  ...loanDetailsResolvers,
  Mutation: {
    ...loanDetailsResolvers.Mutation,
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
        {
          dataSources: {
            loanDetails: { repo },
          },
          username,
        }: LoadDetailsContext
      ): Promise<Commit> =>
        loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: repo,
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
      {
        dataSources: {
          loanDetails: { repo },
        },
        username,
      }: LoadDetailsContext
    ): Promise<Commit[] | { error: any }> => {
      // TODO: any[] is wrong typing. Need fixing

      const result: any[] = [];
      if (typeof requester !== 'undefined' && Object.keys(requester).length > 0) {
        const c = await loanDetailsCommandHandler({
          enrollmentId: username,
          loanDetailsRepo: repo,
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
          loanDetailsRepo: repo,
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
          loanDetailsRepo: repo,
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
          loanDetailsRepo: repo,
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
          loanDetailsRepo: repo,
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
          loanDetailsRepo: repo,
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
          loanDetailsRepo: repo,
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
          loanDetailsRepo: repo,
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
          loanDetailsRepo: repo,
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
};
