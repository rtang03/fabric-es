import { Commit } from '@espresso/fabric-cqrs';
import { AuthenticationError } from 'apollo-server-errors';
import {
  DocContents,
  docContentsCommandHandler,
  DocContentsDS,
  LoanDetails,
  loanDetailsCommandHandler,
  LoanDetailsDS
} from '.';

const NOT_AUTHENICATED = 'no enrollment id';

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
        .catch(({ error }) => error),
    getDocContentsById: async (
      _,
      { documentId },
      {
        dataSources: { docContents },
        enrollmentId
      }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ): Promise<DocContents> =>
      docContents.repo
        .getById({ id: documentId, enrollmentId })
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
    },
    createDataDocContents: async (
      _,
      { userId, documentId, body },
      {
        dataSources: { docContents },
        enrollmentId
      }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : docContentsCommandHandler({
            enrollmentId,
            docContentsRepo: docContents.repo
          })
            .CreateDocContents({
              userId,
              payload: { documentId, content: { body }, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    createFileDocContents: async (
      _,
      { userId, documentId, format, link },
      {
        dataSources: { docContents },
        enrollmentId
      }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : docContentsCommandHandler({
            enrollmentId,
            docContentsRepo: docContents.repo
          })
            .CreateDocContents({
              userId,
              payload: {
                documentId,
                content: { format, link },
                timestamp: Date.now()
              }
            })
            .catch(({ error }) => error)
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
  Document: {
    contents: (
      { documentId },
      _,
      {
        dataSources: { docContents },
        enrollmentId
      }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ) =>
      docContents.repo
        .getById({ id: documentId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => error)
  },
  DocContents: {
    document: ({ documentId }) => ({ __typename: 'Document', documentId })
  },
  Docs: {
    __resolveType: obj => (obj.body ? 'Data' : obj.format ? 'File' : {})
  },
  LocalResponse: {
    __resolveType: obj =>
      obj.commitId ? 'LocalCommit' : obj.message ? 'LocalError' : {}
  }
};
