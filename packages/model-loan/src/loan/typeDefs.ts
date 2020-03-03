import { Commit } from '@espresso/fabric-cqrs';
import { Paginated } from '@espresso/gw-node';
import { ApolloError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import { Loan, loanCommandHandler, LoanDS } from '.';

export const typeDefs = gql`
  type Query {
    getCommitsByLoanId(loanId: String!): [LoanCommit]!
    getLoanById(loanId: String!): Loan
    getPaginatedLoans(pageSize: Int = 10): PaginatedLoans!
  }

  type Mutation {
    applyLoan(userId: String!, loanId: String!, description: String!, reference: String!, comment: String): LoanResponse
    updateLoan(userId: String!, loanId: String!, description: String, reference: String, comment: String): [LoanResponse]!
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
  }

  type PaginatedLoans {
    entities: [Loan!]!
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
    committedAt: String
    entityId: String
    events: [LoanEvent!]
  }

  type LoanError {
    message: String!
    stack: String
  }
`;

export const resolvers = {
  Query: {
    getCommitsByLoanId: async (
      _, { loanId }, { dataSources: { loan } }: { dataSources: { loan: LoanDS }}
    ): Promise<Commit[]> =>
      loan.repo.getCommitById(loanId)
        .then(({ data }) => data || [])
        .catch(error => new ApolloError(error)),
    getLoanById: async (
      _, { loanId }, { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Loan> =>
      loan.repo.getById({ id: loanId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(error => new ApolloError(error)),
    getPaginatedLoans: async (
      _, { pageSize }, { dataSources: { loan } }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Paginated<Loan>> =>
      loan.repo.getByEntityName()
        .then(({ data }: { data: any[] }) => ({
          entities: data || [],
          total: data.length,
          hasMore: data.length > pageSize
        } as Paginated<Loan>))
        .catch(error => new ApolloError(error))
  },
  Mutation: {
    applyLoan: async (
      _,
      { userId, loanId, description, reference, comment },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit | Error> =>
      loanCommandHandler({
        enrollmentId,
        loanRepo: loan.repo
      }).ApplyLoan({
          userId,
          payload: { loanId, description, reference, comment, timestamp: Date.now() }
      }).catch(error => new ApolloError(error)),
    cancelLoan: async (
      _, { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, loanRepo: loan.repo }).CancelLoan({
        userId,
        payload: { loanId, timestamp: Date.now() }
      }).catch(error => new ApolloError(error)),
    approveLoan: async (
      _, { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, loanRepo: loan.repo }).ApproveLoan({
        userId,
        payload: { loanId, timestamp: Date.now() }
      }).catch(error => new ApolloError(error)),
    returnLoan: async (
      _, { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, loanRepo: loan.repo }).ReturnLoan({
        userId,
        payload: { loanId, timestamp: Date.now() }
      }).catch(error => new ApolloError(error)),
    rejectLoan: async (
      _, { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, loanRepo: loan.repo }).RejectLoan({
        userId,
        payload: { loanId, timestamp: Date.now() }
      }).catch(error => new ApolloError(error)),
    expireLoan: async (
      _, { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      loanCommandHandler({ enrollmentId, loanRepo: loan.repo }).ExpireLoan({
        userId,
        payload: { loanId, timestamp: Date.now() }
      }).catch(error => new ApolloError(error)),
    updateLoan: async (
      _,
      { userId, loanId, description, reference, comment },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit[]> => {
      const result: Commit[] = [];
      if (typeof reference !== 'undefined') {
        const c = await loanCommandHandler({
          enrollmentId,
          loanRepo: loan.repo
        }).DefineLoanReference({
          userId,
          payload: { loanId, reference, timestamp: Date.now() }
        }).then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      if (typeof description !== 'undefined') {
        const c = await loanCommandHandler({
          enrollmentId,
          loanRepo: loan.repo
        }).DefineLoanDescription({
          userId,
          payload: { loanId, description, timestamp: Date.now() }
        }).then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      if (typeof comment !== 'undefined') {
        const c = await loanCommandHandler({
          enrollmentId,
          loanRepo: loan.repo
        }).DefineLoanComment({
          userId, payload: { loanId, comment, timestamp: Date.now() }
        }).then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      return result;
    }
  },
  Loan: {
    __resolveReference: (
      { loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Loan> =>
      loan.repo
        .getById({ id: loanId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(error => new ApolloError(error))
  },
  LoanResponse: {
    __resolveType: obj => (obj.commitId ? 'LoanCommit' : obj.message ? 'LoanError' : {})
  }
};
