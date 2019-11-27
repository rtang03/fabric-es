import { Document, documentCommandHandler, DocumentStatus } from '@espresso/common';
import { Commit } from '@espresso/fabric-cqrs';

export const resolvers = {
  Query: {
    getCommitsByDocumentId: async (_, { documentId }, { dataSources: { docDataSource }}): Promise<Commit[] | { error: any }> =>
      docDataSource.repo.getCommitById(documentId)
        .then(({ data }) => data || [])
        .catch(error => ({ error })),
    getDocumentById: async (_, { documentId }, { dataSources: { docDataSource }}): Promise<Document | { error: any }> =>
      docDataSource.repo.getById({ id: documentId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    createDocument: async (
      _, { userId, documentId, loanId, title, reference }, { dataSources: { docDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      documentCommandHandler({ enrollmentId, userRepo: userDataSource.repo, documentRepo: docDataSource.repo }).CreateDocument({
        userId,
        payload: { documentId, loanId, title, reference, timestamp: Date.now() }
      }),
    deleteDocument: async (
      _, { userId, documentId }, { dataSources: { docDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      documentCommandHandler({ enrollmentId, userRepo: userDataSource.repo, documentRepo: docDataSource.repo }).DeleteDocument({
        userId, payload: { documentId, timestamp: Date.now() }
      }),
    restrictAccess: async (
      _, { userId, documentId }, { dataSources: { docDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      documentCommandHandler({ enrollmentId, userRepo: userDataSource.repo, documentRepo: docDataSource.repo }).RestrictDocumentAccess({
        userId, payload: { documentId, timestamp: Date.now() }
      }),
    updateDocument: async (
      _, { userId, documentId, loanId, title, reference }, { dataSources: { docDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit[] | { error: any }> => {
      const result: Commit[] = [];
      if (loanId) {
        const c = await documentCommandHandler({ enrollmentId, userRepo: userDataSource.repo, documentRepo: docDataSource.repo }).DefineDocumentLoanId({
          userId, payload: { documentId, loanId, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (title) {
        const c = await documentCommandHandler({ enrollmentId, userRepo: userDataSource.repo, documentRepo: docDataSource.repo }).DefineDocumentTitle({
          userId, payload: { documentId, title, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      if (reference) {
        const c = await documentCommandHandler({ enrollmentId, userRepo: userDataSource.repo, documentRepo: docDataSource.repo }).DefineDocumentReference({
          userId, payload: { documentId, reference, timestamp: Date.now() }
        }).then(data => data).catch(({ message, stack }) => ({ message, stack }));
        result.push(c);
      }
      return result;
    }
  },
  Loan: {
    documents: ({ loanId }, _, { dataSources: { docDataSource }}) => {
      // console.log('001 resolvers (document) - Loan: documents:', `loanId: ${loanId}`);
      return docDataSource.repo.getProjection({ where: { loanId }})
        // .then(data => {
        //   console.log('peer-node/document/resolvers.ts - Loan: documents:', `loanId: ${loanId}`, data);
        //   return data;
        // })
        .then(({ data }) => data);
    }
  },
  Document: {
    __resolveReference: ({ documentID }, { dataSources: { docDataSource }}): Promise<Document> => {
      return docDataSource.repo.getById({ id: documentID })
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
