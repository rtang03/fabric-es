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
      _,
      { userId, documentId, loanId, title, reference, link },
      { dataSources: { docDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      documentCommandHandler({ enrollmentId, userRepo: userDataSource.repo, documentRepo: docDataSource.repo }).CreateDocument({
        userId,
        payload: { documentId, loanId, title, reference, link, timestamp: Date.now() }
      })
  },
  Loan: {
    documents: ({ loanId }, _, { dataSources: { docDataSource }}) =>
      docDataSource.repo.getProjection({ where: { loanId }})
        .then(({ projections }) => projections)
  },
  Document: {
    loan(documents) {
      return { __typename: 'Loan', loanId: documents.loanId };
    }
  }
};
