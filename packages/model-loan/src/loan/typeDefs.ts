import { Commit } from '@espresso/fabric-cqrs';
import { AuthenticationError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import { Loan, loanCommandHandler, LoanDS } from '.';

export const typeDefs = gql`
  type Query {
    getCommitsByLoanId(loanId: String!): [LoanCommit]!
    getLoanById(loanId: String!): Loan
  }

  type Mutation {
    applyLoan(userId: String!, loanId: String!, description: String, reference: String!): LoanResponse
    cancelLoan(userId: String!, loanId: String!): LoanResponse
    approveLoan(userId: String!, loanId: String!): LoanResponse
    returnLoan(userId: String!, loanId: String!): LoanResponse
    rejectLoan(userId: String!, loanId: String!): LoanResponse
    expireLoan(userId: String!, loanId: String!): LoanResponse
    updateLoan(userId: String!, loanId: String!, description: String, reference: String): [LoanResponse]!
  }

  type Loan @key(fields: "loanId") {
    loanId: String!
    ownerId: String!
    description: String
    reference: String!
    status: Int!
    timestamp: String!
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

const NOT_AUTHENICATED = 'no enrollment id';

export const resolvers = {
  Query: {
    getCommitsByLoanId: async (
      _,
      { loanId },
      { dataSources: { loan } }: { dataSources: { loan: LoanDS } }
    ): Promise<Commit[]> =>
      loan.repo
        .getCommitById(loanId)
        .then(({ data }) => data || [])
        .catch(({ error }) => error),
    getLoanById: async (
      _,
      { loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Loan> =>
      loan.repo
        .getById({ id: loanId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => error)
  },
  Mutation: {
    applyLoan: async (
      _,
      { userId, loanId, description, reference },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : loanCommandHandler({
            enrollmentId,
            loanRepo: loan.repo
          })
            .ApplyLoan({
              userId,
              payload: { loanId, description, reference, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    cancelLoan: async (
      _,
      { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : loanCommandHandler({ enrollmentId, loanRepo: loan.repo })
            .CancelLoan({
              userId,
              payload: { loanId, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    approveLoan: async (
      _,
      { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : loanCommandHandler({ enrollmentId, loanRepo: loan.repo })
            .ApproveLoan({
              userId,
              payload: { loanId, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    returnLoan: async (
      _,
      { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : loanCommandHandler({ enrollmentId, loanRepo: loan.repo })
            .ReturnLoan({
              userId,
              payload: { loanId, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    rejectLoan: async (
      _,
      { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : loanCommandHandler({ enrollmentId, loanRepo: loan.repo })
            .RejectLoan({
              userId,
              payload: { loanId, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    expireLoan: async (
      _,
      { userId, loanId },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : loanCommandHandler({ enrollmentId, loanRepo: loan.repo })
            .ExpireLoan({
              userId,
              payload: { loanId, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    updateLoan: async (
      _,
      { userId, loanId, description, reference },
      { dataSources: { loan }, enrollmentId }: { dataSources: { loan: LoanDS }; enrollmentId: string }
    ): Promise<Commit[] | { error: any }> => {
      if (!enrollmentId) throw new AuthenticationError(NOT_AUTHENICATED);

      const result: Commit[] = [];
      if (reference) {
        const c = await loanCommandHandler({
          enrollmentId,
          loanRepo: loan.repo
        })
          .DefineLoanReference({
            userId,
            payload: { loanId, reference, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (description) {
        const c = await loanCommandHandler({
          enrollmentId,
          loanRepo: loan.repo
        })
          .DefineLoanDescription({
            userId,
            payload: { loanId, description, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
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
        .catch(({ error }) => error)
  },
  LoanResponse: {
    __resolveType: obj => (obj.commitId ? 'LoanCommit' : obj.message ? 'LoanError' : {})
  }
};
