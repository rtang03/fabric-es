import { Commit } from '@espresso/fabric-cqrs';
import { AuthenticationError } from 'apollo-server-errors';
import { Document, documentCommandHandler, DocumentDS } from '.';

const NOT_AUTHENICATED = 'no enrollment id';

export const resolvers = {
  Query: {
    getCommitsByDocumentId: async (
      _,
      { documentId },
      { dataSources: { document } }: { dataSources: { document: DocumentDS } }
    ): Promise<Commit[]> =>
      document.repo
        .getCommitById(documentId)
        .then(({ data }) => data || [])
        .catch(({ error }) => error),
    getDocumentById: async (
      _,
      { documentId },
      {
        dataSources: { document },
        enrollmentId
      }: { dataSources: { document: DocumentDS }; enrollmentId }
    ): Promise<Document> =>
      document.repo
        .getById({ id: documentId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => error)
  },
  Mutation: {
    createDocument: async (
      _,
      { userId, documentId, loanId, title, reference, link },
      {
        dataSources: { document },
        enrollmentId
      }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : documentCommandHandler({
            enrollmentId,
            documentRepo: document.repo
          })
            .CreateDocument({
              userId,
              payload: {
                documentId,
                loanId,
                title,
                reference,
                link,
                timestamp: Date.now()
              }
            })
            .catch(({ error }) => error),
    deleteDocument: async (
      _,
      { userId, documentId },
      {
        dataSources: { document },
        enrollmentId
      }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : documentCommandHandler({
            enrollmentId,
            documentRepo: document.repo
          })
            .DeleteDocument({
              userId,
              payload: { documentId, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    restrictAccess: async (
      _,
      { userId, documentId },
      {
        dataSources: { document },
        enrollmentId
      }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : documentCommandHandler({
            enrollmentId,
            documentRepo: document.repo
          })
            .RestrictDocumentAccess({
              userId,
              payload: { documentId, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    updateDocument: async (
      _,
      { userId, documentId, loanId, title, reference, link },
      {
        dataSources: { document },
        enrollmentId
      }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit[] | { error: any }> => {
      if (!enrollmentId) throw new AuthenticationError(NOT_AUTHENICATED);

      const result: Commit[] = [];
      if (loanId) {
        const c = await documentCommandHandler({
          enrollmentId,
          documentRepo: document.repo
        })
          .DefineDocumentLoanId({
            userId,
            payload: { documentId, loanId, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (title) {
        const c = await documentCommandHandler({
          enrollmentId,
          documentRepo: document.repo
        })
          .DefineDocumentTitle({
            userId,
            payload: { documentId, title, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (reference) {
        const c = await documentCommandHandler({
          enrollmentId,
          documentRepo: document.repo
        })
          .DefineDocumentReference({
            userId,
            payload: { documentId, reference, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (link) {
        const c = await documentCommandHandler({
          enrollmentId,
          documentRepo: document.repo
        })
          .DefineDocumentLink({
            userId,
            payload: { documentId, link, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      return result;
    }
  },
  Loan: {
    documents: (
      { loanId },
      _,
      { dataSources: { document } }: { dataSources: { document: DocumentDS } }
    ) =>
      document.repo
        .getProjection({ where: { loanId } })
        .then(({ data }) => data)
        .catch(({ error }) => error)
  },
  Document: {
    __resolveReference: (
      { documentId },
      {
        dataSources: { document },
        enrollmentId
      }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Document> =>
      document.repo
        .getById({ id: documentId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => error),
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  },
  DocResponse: {
    __resolveType: obj =>
      obj.commitId ? 'DocCommit' : obj.message ? 'DocError' : {}
  }
};
