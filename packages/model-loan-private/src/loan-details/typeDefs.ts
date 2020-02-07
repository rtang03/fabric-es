import { Commit } from '@espresso/fabric-cqrs';
import { AuthenticationError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import {
  LoanDetails,
  loanDetailsCommandHandler,
  LoanDetailsDS
} from '.';

const NOT_AUTHENICATED = 'no enrollment id';

export const typeDefs = gql`
  type Query {
    getLoanDetailsById(loanId: String!): LoanDetails
  }

  type Mutation {
    createLoanDetails(
      userId: String!,
      loanId: String!,
      requester: LoanRequesterInput!,
      contact: ContactInfoInput!,
      loanType: String,
      startDate: String!,
      tenor: Int!,
      currency: String!,
      requestedAmt: Float!,
      approvedAmt: Float,
      comment: String
    ): LoanDetailsResp
    updateLoanDetails(
      userId: String!,
      loanId: String!,
      requester: LoanRequesterInput,
      contact: ContactInfoInput,
      loanType: String,
      startDate: String,
      tenor: Int,
      currency: String,
      requestedAmt: Float,
      approvedAmt: Float,
      comment: String
    ): [LoanDetailsResp]!
  }

  ###
  # Local Type: Loan Details
  ###
  type LoanDetails @key(fields: "loanId") {
    loanId: String!
    requester: LoanRequester!
    contact: ContactInfo!
    loanType: String
    startDate: String!
    tenor: Int!
    currency: String!
    requestedAmt: Float!
    approvedAmt: Float
    comment: String
    timestamp: String!
    loan: Loan
  }

  input LoanRequesterInput {
    registration: String
    name: String
    type: String
  }
  type LoanRequester {
    registration: String!
    name: String!
    type: String
  }

  input ContactInfoInput {
    salutation: String
    name: String
    title: String
    phone: String
    email: String
  }
  type ContactInfo {
    salutation: String
    name: String!
    title: String
    phone: String!
    email: String!
  }

  ###
  # Mutation responses
  ###
  union LoanDetailsResp = LoanDetailsCommit | LoanDetailsError

  type LoanDetailsCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
  }

  type LoanDetailsError {
    message: String!
    stack: String
  }

  ###
  # Federated types
  ###
  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    details: LoanDetails
  }
`;

export const resolvers = {
  Query: {
    getLoanDetailsById: async (
      _,
      { loanId },
      {
        dataSources: { loanDetails },
        enrollmentId
      }: { dataSources: { loanDetails: LoanDetailsDS }; enrollmentId: string }
    ): Promise<LoanDetails> =>
      loanDetails.repo
        .getById({ id: loanId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => error)
  },
  Mutation: {
    createLoanDetails: async (
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
        comment
      },
      {
        dataSources: { loanDetails },
        enrollmentId
      }: { dataSources: { loanDetails: LoanDetailsDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : loanDetailsCommandHandler({
            enrollmentId,
            loanDetailsRepo: loanDetails.repo
          })
            .CreateLoanDetails({
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
                timestamp: Date.now()
              }
            })
            .catch(({ error }) => error),
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
        comment
      },
      {
        dataSources: { loanDetails },
        enrollmentId
      }: { dataSources: { loanDetails: LoanDetailsDS }; enrollmentId: string }
    ): Promise<Commit[] | { error: any }> => {
      if (!enrollmentId) throw new AuthenticationError(NOT_AUTHENICATED);

      const result: Commit[] = [];
      if (requester && Object.keys(requester).length > 0) {
        const c = await loanDetailsCommandHandler({
          enrollmentId,
          loanDetailsRepo: loanDetails.repo
        })
          .DefineLoanRequester({
            userId,
            payload: { loanId, requester, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (contact && Object.keys(contact).length > 0) {
        const c = await loanDetailsCommandHandler({
          enrollmentId,
          loanDetailsRepo: loanDetails.repo
        })
          .DefineLoanContact({
            userId,
            payload: { loanId, contact, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (loanType) {
        const c = await loanDetailsCommandHandler({
          enrollmentId,
          loanDetailsRepo: loanDetails.repo
        })
          .DefineLoanType({
            userId,
            payload: { loanId, loanType, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (startDate) {
        const c = await loanDetailsCommandHandler({
          enrollmentId,
          loanDetailsRepo: loanDetails.repo
        })
          .DefineLoanStartDate({
            userId,
            payload: { loanId, startDate, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (tenor) {
        const c = await loanDetailsCommandHandler({
          enrollmentId,
          loanDetailsRepo: loanDetails.repo
        })
          .DefineLoanTenor({
            userId,
            payload: { loanId, tenor, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (currency) {
        const c = await loanDetailsCommandHandler({
          enrollmentId,
          loanDetailsRepo: loanDetails.repo
        })
          .DefineLoanCurrency({
            userId,
            payload: { loanId, currency, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (requestedAmt) {
        const c = await loanDetailsCommandHandler({
          enrollmentId,
          loanDetailsRepo: loanDetails.repo
        })
          .DefineLoanRequestedAmt({
            userId,
            payload: { loanId, requestedAmt, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (approvedAmt) {
        const c = await loanDetailsCommandHandler({
          enrollmentId,
          loanDetailsRepo: loanDetails.repo
        })
          .DefineLoanApprovedAmt({
            userId,
            payload: { loanId, approvedAmt, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (comment) {
        const c = await loanDetailsCommandHandler({
          enrollmentId,
          loanDetailsRepo: loanDetails.repo
        })
          .DefineLoanComment({
            userId,
            payload: { loanId, comment, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      return result;
    }
  },
  Loan: {
    details: (
      { loanId },
      _,
      {
        dataSources: { loanDetails },
        enrollmentId
      }: { dataSources: { loanDetails: LoanDetailsDS }; enrollmentId: string }
    ) =>
      loanDetails.repo
        .getById({ id: loanId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => error)
  },
  LoanDetails: {
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  },
  LoanDetailsResp: {
    __resolveType: obj =>
      obj.commitId ? 'LoanDetailsCommit' : obj.message ? 'LoanDetailsError' : {}
  }
};
