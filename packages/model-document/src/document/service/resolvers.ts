import type { Commit, Paginated } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { ApolloError } from 'apollo-server-errors';
import type { DocumentContext, DocumentOutput } from '..';
import { documentCommandHandler } from '..';

const logger = getLogger('document/typeDefs.js');

export const resolvers = {
  Query: {
    getCommitsByDocumentId: catchResolverErrors(
      async (
        _,
        { documentId }: { documentId: string },
        {
          dataSources: {
            document: { repo },
          },
        }: DocumentContext
      ): Promise<Commit[]> => repo.getCommitById({ id: documentId }).then(({ data }) => data || []),
      { fcnName: 'getCommitsByDocumentId', logger, useAuth: false }
    ),
    getDocumentById: catchResolverErrors(
      async (
        _,
        { documentId }: { documentId: string },
        {
          dataSources: {
            document: { repo },
          },
          username,
        }: DocumentContext
      ): Promise<DocumentOutput> => {
        const { data, status, error } = await repo.fullTextSearchEntity({
          entityName: 'document',
          query: `@id:${documentId}`,
          cursor: 0,
          pagesize: 1,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items[0];
      },
      { fcnName: 'getDocumentById', logger, useAuth: false }
    ),
    getPaginatedDocuments: catchResolverErrors(
      async (
        _,
        { cursor, pageSize }: { cursor: number; pageSize: number },
        {
          dataSources: {
            document: { repo },
          },
        }: DocumentContext
      ): Promise<Paginated<DocumentOutput>> => {
        const { data, error, status } = await repo.fullTextSearchEntity({
          entityName: 'document',
          query: '*',
          cursor: cursor ?? 0,
          pagesize: pageSize,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data;
      },
      { fcnName: 'getPaginatedDocuments', logger, useAuth: false }
    ),
    searchDocumentByFields: catchResolverErrors(
      async (
        _,
        { where }: { where: string },
        {
          dataSources: {
            document: { repo },
          },
        }: DocumentContext
      ): Promise<DocumentOutput[]> => {
        const whereJSON = JSON.parse(where);
        const [key, value] = Object.entries(whereJSON)[0];
        const { data, error, status } = await repo.fullTextSearchEntity({
          entityName: 'document',
          query: `@${key}:${value}*`,
          cursor: 0,
          pagesize: 100,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items || [];
      },
      { fcnName: 'searchDocumentByFields', logger, useAuth: false }
    ),
    searchDocumentContains: catchResolverErrors(
      async (
        _,
        { contains }: { contains: string },
        {
          dataSources: {
            document: { repo },
          },
        }: DocumentContext
      ): Promise<DocumentOutput[]> => {
        const { data, status, error } = await repo.fullTextSearchEntity({
          entityName: 'document',
          query: `@title:${contains}*`,
          cursor: 0,
          pagesize: 100,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items || [];
      },
      { fcnName: 'searchDocumentContains', logger, useAuth: false }
    ),
  },
  Mutation: {
    createDocument: catchResolverErrors(
      async (
        _,
        { userId, documentId, loanId, title, reference },
        {
          dataSources: {
            document: { repo },
          },
          username,
        }: DocumentContext
      ): Promise<Commit> =>
        documentCommandHandler({
          enrollmentId: username,
          documentRepo: repo,
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
      async (
        _,
        { userId, documentId },
        {
          dataSources: {
            document: { repo },
          },
          username,
        }: DocumentContext
      ): Promise<Commit> =>
        documentCommandHandler({
          enrollmentId: username,
          documentRepo: repo,
        }).DeleteDocument({
          userId,
          payload: { documentId, timestamp: Date.now() },
        }),
      { fcnName: 'deleteDocument', logger, useAuth: true }
    ),
    restrictAccess: catchResolverErrors(
      async (
        _,
        { userId, documentId },
        {
          dataSources: {
            document: { repo },
          },
          username,
        }: DocumentContext
      ): Promise<Commit> =>
        documentCommandHandler({
          enrollmentId: username,
          documentRepo: repo,
        }).RestrictDocumentAccess({
          userId,
          payload: { documentId, timestamp: Date.now() },
        }),
      { fcnName: 'restrictAccess', logger, useAuth: true }
    ),
    updateDocument: async (
      _,
      { userId, documentId, loanId, title, reference },
      {
        dataSources: {
          document: { repo },
        },
        username,
      }: DocumentContext
    ): Promise<Commit[]> => {
      const result = [];

      if (typeof loanId !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: repo,
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
          documentRepo: repo,
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
          documentRepo: repo,
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
      async (
        { loanId }: { loanId: string },
        _,
        {
          dataSources: {
            document: { repo },
          },
        }: DocumentContext
      ): Promise<DocumentOutput[]> => {
        const { data, status, error } = await repo.fullTextSearchEntity({
          entityName: 'document',
          query: `@loanId:${loanId}`,
          cursor: 0,
          pagesize: 100,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items || [];
      },
      { fcnName: 'Loan/docuemnts', logger, useAuth: false }
    ),
  },
  Document: {
    __resolveReference: catchResolverErrors(
      async (
        { documentId }: { documentId: string },
        {
          dataSources: {
            document: { repo },
          },
        }: DocumentContext
      ): Promise<DocumentOutput> => {
        {
          const { data, status, error } = await repo.fullTextSearchEntity({
            entityName: 'document',
            query: `@id:${documentId}`,
            cursor: 0,
            pagesize: 1,
          });

          if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

          return data?.items?.[0];
        }
      },
      { fcnName: 'Document/__resolveReference', logger, useAuth: false }
    ),
    loan: ({ loanId }: { loanId: string }) => ({ __typename: 'Loan', loanId }),
  },
  DocResponse: {
    __resolveType: (obj) => (obj.commitId ? 'DocCommit' : obj.message ? 'DocError' : {}),
  },
};
