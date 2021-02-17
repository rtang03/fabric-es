import type { Commit, Paginated } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { ApolloError } from 'apollo-server-errors';
import type { Document } from './types';
import { documentCommandHandler } from '.';

const logger = getLogger('document/typeDefs.js');

export const resolvers = {
  Query: {
    getCommitsByDocumentId: catchResolverErrors(
      async (_, { documentId }, { dataSources: { document } }): Promise<Commit[]> =>
        document.repo.getCommitById({ id: documentId }).then(({ data }) => data || []),
      { fcnName: 'getCommitsByDocumentId', logger, useAuth: false }
    ),
    getDocumentById: catchResolverErrors(
      async (_, { documentId }, { dataSources: { document }, username }): Promise<Document> =>
        document.repo
          .getById({ id: documentId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'getDocumentById', logger, useAuth: false }
    ),
    getPaginatedDocuments: catchResolverErrors(
      async (_, { pageSize }, { dataSources: { document } }): Promise<Paginated<Document>> =>
        document.repo.getByEntityName().then(
          ({ data }: { data: any[] }) =>
            ({
              items: data || [],
              total: data.length,
              hasMore: data.length > pageSize,
            } as Paginated<Document>)
        ),
      { fcnName: 'getPaginatedDocuments', logger, useAuth: false }
    ),
    searchDocumentByFields: catchResolverErrors(
      async (_, { where }, { dataSources: { document } }): Promise<Document[]> =>
        document.repo.find({ byId: where }).then(({ data }) => Object.values(data)),
      { fcnName: 'searchDocumentByFields', logger, useAuth: false }
    ),
    searchDocumentContains: catchResolverErrors(
      async (_, { contains }, { dataSources: { document } }): Promise<Document[]> =>
        document.repo.find({ byDesc: contains }).then(({ data }) => Object.values(data)),
      { fcnName: 'searchDocumentContains', logger, useAuth: false }
    ),
  },
  Mutation: {
    createDocument: catchResolverErrors(
      async (
        _,
        { userId, documentId, loanId, title, reference },
        { dataSources: { document }, username }
      ): Promise<Commit> =>
        documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo,
        }).CreateDocument({
          userId,
          payload: {
            documentId,
            loanId,
            title,
            reference,
            timestamp: Date.now(),
          },
        }),
      { fcnName: 'createDocument', logger, useAuth: true }
    ),
    deleteDocument: catchResolverErrors(
      async (_, { userId, documentId }, { dataSources: { document }, username }): Promise<Commit> =>
        documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo,
        }).DeleteDocument({
          userId,
          payload: { documentId, timestamp: Date.now() },
        }),
      { fcnName: 'deleteDocument', logger, useAuth: true }
    ),
    restrictAccess: catchResolverErrors(
      async (_, { userId, documentId }, { dataSources: { document }, username }): Promise<Commit> =>
        documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo,
        }).RestrictDocumentAccess({
          userId,
          payload: { documentId, timestamp: Date.now() },
        }),
      { fcnName: 'restrictAccess', logger, useAuth: true }
    ),
    updateDocument: async (
      _,
      { userId, documentId, loanId, title, reference },
      { dataSources: { document }, username }
    ): Promise<Commit[]> => {
      const result = [];

      if (typeof loanId !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo,
        })
          .DefineDocumentLoanId({
            userId,
            payload: { documentId, loanId, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof title !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo,
        })
          .DefineDocumentTitle({
            userId,
            payload: { documentId, title, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      if (typeof reference !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo,
        })
          .DefineDocumentReference({
            userId,
            payload: { documentId, reference, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      return result;
    },
  },
  Loan: {
    documents: catchResolverErrors(
      async ({ loanId }, _, { dataSources: { document } }) =>
        document.repo.find({ where: { loanId } }).then(({ data }) => data),
      { fcnName: 'Loan/docuemnts', logger, useAuth: false }
    ),
  },
  Document: {
    __resolveReference: catchResolverErrors(
      async ({ documentId }, { dataSources: { document }, username }): Promise<Document> =>
        document.repo
          .getById({ id: documentId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'Document/__resolveReference', logger, useAuth: false }
    ),
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId }),
  },
  DocResponse: {
    __resolveType: (obj) => (obj.commitId ? 'DocCommit' : obj.message ? 'DocError' : {}),
  },
};
