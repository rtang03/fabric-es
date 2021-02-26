import type { Commit, Paginated } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { ApolloError } from 'apollo-server-errors';
import { loanCommandHandler } from '../domain';
import type { LoanContext, LoanOutput } from '../domain';

const logger = getLogger('loan/typeDefs.js');

export const resolvers = {
  Query: {
    getCommitsByLoanId: catchResolverErrors(
      async (
        _,
        { loanId }: { loanId: string },
        {
          dataSources: {
            loan: { repo },
          },
        }: LoanContext
      ): Promise<Commit[]> => repo.getCommitById({ id: loanId }).then(({ data }) => data || []),
      { fcnName: 'getCommitsByLoanId', logger, useAuth: false }
    ),
    getLoanById: catchResolverErrors(
      async (
        _,
        { loanId }: { loanId: string },
        {
          dataSources: {
            loan: { repo },
          },
          username,
        }: LoanContext
      ): Promise<LoanOutput> => {
        const { data, status, error } = await repo.fullTextSearchEntity<LoanOutput>({
          entityName: 'loan',
          query: `@id:${loanId}`,
          cursor: 0,
          pagesize: 1,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items[0];
      },
      { fcnName: 'getLoanById', logger, useAuth: false }
    ),
    getPaginatedLoans: catchResolverErrors(
      async (
        _,
        { cursor, pageSize }: { cursor: number; pageSize: number },
        {
          dataSources: {
            loan: { repo },
          },
        }: LoanContext
      ): Promise<Paginated<LoanOutput>> => {
        const { data, error, status } = await repo.fullTextSearchEntity<LoanOutput>({
          entityName: 'loan',
          query: `*`,
          cursor,
          pagesize: pageSize,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data;
      },
      { fcnName: 'getPaginatedLoans', logger, useAuth: true }
    ),
    searchLoanByFields: catchResolverErrors(
      async (
        _,
        { where }: { where: string },
        {
          dataSources: {
            loan: { repo },
          },
        }: LoanContext
      ): Promise<LoanOutput[]> => {
        const whereJSON = JSON.parse(where);
        const [key, value] = Object.entries(whereJSON)[0];
        const { data, status, error } = await repo.fullTextSearchEntity<LoanOutput>({
          entityName: 'loan',
          query: `@${key}:${value}*`,
          cursor: 0,
          pagesize: 100,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items || [];
      },
      { fcnName: 'searchLoanByFields', logger, useAuth: false }
    ),
    searchLoanContains: catchResolverErrors(
      async (
        _,
        { contains }: { contains: string },
        {
          dataSources: {
            loan: { repo },
          },
        }: LoanContext
      ): Promise<LoanOutput[]> => {
        const { data, status, error } = await repo.fullTextSearchEntity<LoanOutput>({
          entityName: 'loan',
          query: `@de:${contains}*`,
          cursor: 0,
          pagesize: 100,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items || [];
      },
      { fcnName: 'searchLoanContains', logger, useAuth: false }
    ),
  },
  Mutation: {
    applyLoan: catchResolverErrors(
      async (
        _,
        { userId, loanId, description, reference, comment },
        {
          dataSources: {
            loan: { repo },
          },
          username,
        }: LoanContext
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: repo,
        }).ApplyLoan({
          userId,
          payload: {
            loanId,
            description,
            reference,
            comment,
            timestamp: Date.now(),
          },
        }),
      { fcnName: 'applyLoan', logger, useAuth: true }
    ),
    cancelLoan: catchResolverErrors(
      async (
        _,
        { userId, loanId },
        {
          dataSources: {
            loan: { repo },
          },
          username,
        }: LoanContext
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: repo,
        }).CancelLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'cancelLoan', logger, useAuth: true }
    ),
    approveLoan: catchResolverErrors(
      async (
        _,
        { userId, loanId },
        {
          dataSources: {
            loan: { repo },
          },
          username,
        }: LoanContext
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: repo,
        }).ApproveLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'approveLoan', logger, useAuth: true }
    ),
    returnLoan: catchResolverErrors(
      async (
        _,
        { userId, loanId },
        {
          dataSources: {
            loan: { repo },
          },
          username,
        }: LoanContext
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: repo,
        }).ReturnLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'returnLoan', logger, useAuth: true }
    ),
    rejectLoan: catchResolverErrors(
      async (
        _,
        { userId, loanId },
        {
          dataSources: {
            loan: { repo },
          },
          username,
        }: LoanContext
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: repo,
        }).RejectLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'rejectLoan', logger, useAuth: true }
    ),
    expireLoan: catchResolverErrors(
      async (
        _,
        { userId, loanId },
        {
          dataSources: {
            loan: { repo },
          },
          username,
        }: LoanContext
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: repo,
        }).ExpireLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'expireLoan', logger, useAuth: true }
    ),
    updateLoan: async (
      _,
      { userId, loanId, description, reference, comment },
      {
        dataSources: {
          loan: { repo },
        },
        username,
      }: LoanContext
    ): Promise<Commit[]> => {
      // TODO: any[] is wrong typing, need fixing
      const result: any[] = [];

      if (typeof reference !== 'undefined') {
        const c = await loanCommandHandler({
          enrollmentId: username,
          loanRepo: repo,
        })
          .DefineLoanReference({
            userId,
            payload: { loanId, reference, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof description !== 'undefined') {
        const c = await loanCommandHandler({
          enrollmentId: username,
          loanRepo: repo,
        })
          .DefineLoanDescription({
            userId,
            payload: { loanId, description, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof comment !== 'undefined') {
        const c = await loanCommandHandler({
          enrollmentId: username,
          loanRepo: repo,
        })
          .DefineLoanComment({
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
    __resolveReference: catchResolverErrors(
      async (
        { loanId },
        {
          dataSources: {
            loan: { repo },
          },
          username,
        }: LoanContext
      ): Promise<LoanOutput> => {
        const { data, status, error } = await repo.fullTextSearchEntity<LoanOutput>({
          entityName: 'loan',
          query: `@id:${loanId}`,
          cursor: 0,
          pagesize: 1,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items?.[0];
      },
      { fcnName: 'Loan/__resolveReference', logger, useAuth: false }
    ),
  },
  LoanResponse: {
    __resolveType: (obj) => (obj.commitId ? 'LoanCommit' : obj.message ? 'LoanError' : {}),
  },
};
