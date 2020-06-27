import { Commit, Paginated } from '@fabric-es/fabric-cqrs';
import { catchErrors, getLogger } from '@fabric-es/gateway-lib';
import { ApolloError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import { Loan, loanCommandHandler, LoanDS } from '.';

export const typeDefs = gql`
  type Query {
    getCommitsByLoanId(loanId: String!): [LoanCommit]!
    getLoanById(loanId: String!): Loan
    getPaginatedLoans(pageSize: Int = 10): PaginatedLoans!
    searchLoanByFields(where: String!): [Loan]
    searchLoanContains(contains: String!): [Loan]
  }

  type Mutation {
    applyLoan(
      userId: String!
      loanId: String!
      description: String!
      reference: String!
      comment: String
    ): LoanResponse
    updateLoan(
      userId: String!
      loanId: String!
      description: String
      reference: String
      comment: String
    ): [LoanResponse]!
    cancelLoan(userId: String!, loanId: String!): LoanResponse
    approveLoan(userId: String!, loanId: String!): LoanResponse
    returnLoan(userId: String!, loanId: String!): LoanResponse
    rejectLoan(userId: String!, loanId: String!): LoanResponse
    expireLoan(userId: String!, loanId: String!): LoanResponse
  }

  type Loan @key(fields: "loanId") {
    loanId: String!
    ownerId: String!
    description: String!
    reference: String!
    comment: String
    status: Int!
    timestamp: String!
    _organization: [String]!
  }

  type PaginatedLoans {
    items: [Loan!]!
    total: Int!
    hasMore: Boolean!
  }

  union LoanResponse = LoanCommit | LoanError

  type LoanEvent {
    type: String
  }

  type LoanCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    mspId: String
    entityId: String
    events: [LoanEvent!]
  }

  type LoanError {
    message: String!
    stack: String
  }
`;

type Context = { dataSources: { loan: LoanDS }; username: string };

const logger = getLogger('loan/typeDefs.js');

export const resolvers = {
  Query: {
    getCommitsByLoanId: catchErrors(
      async (_, { loanId }, { dataSources: { loan } }: Context): Promise<Commit[]> =>
        loan.repo.getCommitById({ id: loanId }).then(({ data }) => data || []),
      { fcnName: 'getCommitsByLoanId', logger, useAuth: false }
    ),
    getLoanById: catchErrors(
      async (_, { loanId }, { dataSources: { loan }, username }: Context): Promise<Loan> =>
        loan.repo
          .getById({ id: loanId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'getLoanById', logger, useAuth: false }
    ),
    getPaginatedLoans: catchErrors(
      async (_, { pageSize }, { dataSources: { loan } }: Context): Promise<Paginated<Loan>> =>
        loan.repo.getByEntityName().then(
          ({ data }: { data: any[] }) =>
            ({
              items: data || [],
              total: data.length,
              hasMore: data.length > pageSize,
            } as Paginated<Loan>)
        ),
      { fcnName: 'getPaginatedLoans', logger, useAuth: true }
    ),
    searchLoanByFields: catchErrors(
      async (_, { id }, { dataSources: { loan } }: Context): Promise<Loan[]> =>
        loan.repo.find({ byId: id }).then(({ data }) => Object.values(data)),
      { fcnName: 'searchLoanByFields', logger, useAuth: false }
    ),
    searchLoanContains: catchErrors(
      async (_, { contains }, { dataSources: { loan } }: Context): Promise<Loan[]> =>
        loan.repo.find({ byDesc: contains }).then(({ data }) => Object.values(data)),
      { fcnName: 'searchLoanContains', logger, useAuth: false }
    ),
  },
  Mutation: {
    applyLoan: catchErrors(
      async (
        _,
        { userId, loanId, description, reference, comment },
        { dataSources: { loan }, username }: Context
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: loan.repo,
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
    cancelLoan: catchErrors(
      async (
        _,
        { userId, loanId },
        { dataSources: { loan }, username }: Context
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: loan.repo,
        }).CancelLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'cancelLoan', logger, useAuth: true }
    ),
    approveLoan: catchErrors(
      async (
        _,
        { userId, loanId },
        { dataSources: { loan }, username }: Context
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: loan.repo,
        }).ApproveLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'approveLoan', logger, useAuth: true }
    ),
    returnLoan: catchErrors(
      async (
        _,
        { userId, loanId },
        { dataSources: { loan }, username }: Context
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: loan.repo,
        }).ReturnLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'returnLoan', logger, useAuth: true }
    ),
    rejectLoan: catchErrors(
      async (
        _,
        { userId, loanId },
        { dataSources: { loan }, username }: Context
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: loan.repo,
        }).RejectLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'rejectLoan', logger, useAuth: true }
    ),
    expireLoan: catchErrors(
      async (
        _,
        { userId, loanId },
        { dataSources: { loan }, username }: Context
      ): Promise<Commit> =>
        loanCommandHandler({
          enrollmentId: username,
          loanRepo: loan.repo,
        }).ExpireLoan({
          userId,
          payload: { loanId, timestamp: Date.now() },
        }),
      { fcnName: 'expireLoan', logger, useAuth: true }
    ),
    updateLoan: async (
      _,
      { userId, loanId, description, reference, comment },
      { dataSources: { loan }, username }: Context
    ): Promise<Commit[]> => {
      // TODO: any[] is wrong typing, need fixing
      const result: any[] = [];

      if (typeof reference !== 'undefined') {
        const c = await loanCommandHandler({
          enrollmentId: username,
          loanRepo: loan.repo,
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
          loanRepo: loan.repo,
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
          loanRepo: loan.repo,
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
    __resolveReference: catchErrors(
      async ({ loanId }, { dataSources: { loan }, username }: Context): Promise<Loan> =>
        loan.repo
          .getById({ id: loanId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'Loan/__resolveReference', logger, useAuth: false }
    ),
  },
  LoanResponse: {
    __resolveType: (obj) => (obj.commitId ? 'LoanCommit' : obj.message ? 'LoanError' : {}),
  },
};
