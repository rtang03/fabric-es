import { Commit } from '@espresso/fabric-cqrs';
import { Document, documentCommandHandler, DocumentDS } from '.';

export const resolvers = {
  Query: {
    getCommitsByDocumentId: async (
      _, { documentId }, { dataSources: { document }}: { dataSources: { document: DocumentDS }}
    ): Promise<Commit[] | { error: any }> =>
      document.repo.getCommitById(documentId)
        .then(({ data }) => data || [])
        .catch(error => ({ error })),
    getDocumentById: async (
      _, { documentId }, { dataSources: { document }}: { dataSources: { document: DocumentDS }}
    ): Promise<Document | { error: any }> =>
      document.repo.getById({ id: documentId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    createDocument: async (
      _, { userId, documentId, loanId, title, reference },
      { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }, enrollmentId: string }
    ): Promise<Commit> =>
      documentCommandHandler({ enrollmentId, documentRepo: document.repo }).CreateDocument({
        userId,
        payload: { documentId, loanId, title, reference, timestamp: Date.now() }
      }),
    deleteDocument: async (
      _, { userId, documentId }, { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }, enrollmentId: string }
    ): Promise<Commit> =>
      documentCommandHandler({ enrollmentId, documentRepo: document.repo }).DeleteDocument({
        userId, payload: { documentId, timestamp: Date.now() }
      }),
    restrictAccess: async (
      _, { userId, documentId }, { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }, enrollmentId: string }
    ): Promise<Commit> =>
      documentCommandHandler({ enrollmentId, documentRepo: document.repo }).RestrictDocumentAccess({
        userId, payload: { documentId, timestamp: Date.now() }
      }),
    updateDocument: async (
      _, { userId, documentId, loanId, title, reference },
      { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }, enrollmentId: string }
    ): Promise<Commit[] | { error: any }> => {
      const result: Commit[] = [];
      if (loanId) {
        const c = await documentCommandHandler({ enrollmentId, documentRepo: document.repo }).DefineDocumentLoanId({
          userId, payload: { documentId, loanId, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (title) {
        const c = await documentCommandHandler({ enrollmentId, documentRepo: document.repo }).DefineDocumentTitle({
          userId, payload: { documentId, title, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (reference) {
        const c = await documentCommandHandler({ enrollmentId, documentRepo: document.repo }).DefineDocumentReference({
          userId, payload: { documentId, reference, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      return result;
    }
  },
  Loan: {
    documents: ({ loanId }, _, { dataSources: { document }}: { dataSources: { document: DocumentDS }}) => {
      // console.log('001 resolvers (document) - Loan: documents:', `loanId: ${loanId}`);
      return document.repo.getProjection({ where: { loanId }})
        // .then(data => {
        //   console.log('peer-node/document/resolvers.ts - Loan: documents:', `loanId: ${loanId}`, data);
        //   return data;
        // })
        .then(({ data }) => data);
    }
  },
  Document: {
    __resolveReference: ({ documentId }, { dataSources: { document }}: { dataSources: { document: DocumentDS }}): Promise<Document> => {
      return document.repo.getById({ id: documentId })
        .then(({ currentState }) => currentState);
    },
    loan(documents) {
      // console.log('peer-node/document/resolvers.ts - Document: loan(documents):', documents);
      return { __typename: 'Loan', loanId: documents.loanId };
    }
  },
  DocResponse: {
    __resolveType(obj, _, __) {
      if (obj.commitId) {
        return 'DocCommit';
      }
      if (obj.message) {
        return 'DocError';
      }
      return {};
    }
  }
};
