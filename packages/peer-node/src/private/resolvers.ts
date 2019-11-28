import { Commit } from '@espresso/fabric-cqrs';
import { DocContents, docContentsCommandHandler, DocContentsDS, LoanDetails, loanDetailsCommandHandler, LoanDetailsDS } from '.';

export const resolvers = {
  Query: {
    getLoanDetailsById: async (
      _, { loanId }, { dataSources: { loanDetails }}: { dataSources: { loanDetails: LoanDetailsDS }}
    ): Promise<LoanDetails | { error: any }> =>
      loanDetails.repo.getById({ id: loanId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error })),
    getDocContentsById: async (
      _, { documentId }, { dataSources: { docContents }}: { dataSources: { docContents: DocContentsDS }}
    ): Promise<DocContents | { error: any }> =>
      docContents.repo.getById({ id: documentId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    createLoanDetails: async (
      _, { userId, loanId, requester, contact, loanType, startDate, tenor, currency, requestedAmt, approvedAmt, comment },
      { dataSources: { loanDetails }, enrollmentId }: { dataSources: { loanDetails: LoanDetailsDS }, enrollmentId: string }
    ): Promise<Commit> =>
      loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).CreateLoanDetails({
        userId,
        payload: { loanId, requester, contact, loanType, startDate, tenor, currency, requestedAmt, approvedAmt, comment, timestamp: Date.now() }
      }),
    updateLoanDetails: async (
      _, { userId, loanId, requester, contact, loanType, startDate, tenor, currency, requestedAmt, approvedAmt, comment },
        { dataSources: { loanDetails }, enrollmentId }: { dataSources: { loanDetails: LoanDetailsDS }, enrollmentId: string }
    ): Promise<Commit[] | { error: any }> => {
      const result: Commit[] = [];
      if (requester && (Object.keys(requester).length > 0)) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).DefineLoanRequester({
          userId, payload: { loanId, requester, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (contact && (Object.keys(contact).length > 0)) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).DefineLoanContact({
          userId, payload: { loanId, contact, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (loanType) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).DefineLoanType({
          userId, payload: { loanId, loanType, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (startDate) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).DefineLoanStartDate({
          userId, payload: { loanId, startDate, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (tenor) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).DefineLoanTenor({
          userId, payload: { loanId, tenor, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (currency) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).DefineLoanCurrency({
          userId, payload: { loanId, currency, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (requestedAmt) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).DefineLoanRequestedAmt({
          userId, payload: { loanId, requestedAmt, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (approvedAmt) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).DefineLoanApprovedAmt({
          userId, payload: { loanId, approvedAmt, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      if (comment) {
        const c = await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo: loanDetails.repo }).DefineLoanComment({
          userId, payload: { loanId, comment, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack}) => ({ message, stack }));
        result.push(c);
      }
      return result;
    },
    createDataDocContents: async (
      _, { userId, documentId, body }, { dataSources: { docContents }, enrollmentId }: { dataSources: { docContents: DocContentsDS }, enrollmentId: string }
    ): Promise<Commit> =>
      docContentsCommandHandler({ enrollmentId, docContentsRepo: docContents.repo }).CreateDocContents({
        userId,
        payload: { documentId, content: { body }, timestamp: Date.now() }
      }),
    createFileDocContents: async (
      _, { userId, documentId, format, link }, { dataSources: { docContents }, enrollmentId }: { dataSources: { docContents: DocContentsDS }, enrollmentId: string }
    ): Promise<Commit> =>
      docContentsCommandHandler({ enrollmentId, docContentsRepo: docContents.repo }).CreateDocContents({
        userId,
        payload: { documentId, content: { format, link }, timestamp: Date.now() }
      }),
  },
  Loan: {
    details: (loan, _, { dataSources: { loanDetails }}: { dataSources: { loanDetails: LoanDetailsDS }}) => {
      return loanDetails.repo.getById({ id: loan.loanId })
        .then(({ currentState }) => currentState);
    }
  },
  LoanDetails: {
    loan(details) {
      return { __typename: 'Loan', loanId: details.loanId };
    }
  },
  Document: {
    contents: (document, _, { dataSources: { docContents }}: { dataSources: { docContents: DocContentsDS }}) => {
      return docContents.repo.getById({ id: document.documentId })
        .then(({ currentState }) => currentState);
    }
  },
  DocContents: {
    document(contents) {
      return { __typename: 'Document', documentId: contents.documentId };
    }
  },
  Docs: {
    __resolveType(obj, _, __) {
      if (obj.body) {
        return 'Data';
      }
      if (obj.format) {
        return 'File';
      }
      return {};
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
