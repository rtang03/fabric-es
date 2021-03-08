import type { Commit } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { documentResolvers } from '@fabric-es/model-document';
import { ApolloError } from 'apollo-server-errors';
import { documentCommandHandler, DocumentContext } from '../domain';

const logger = getLogger('document/typeDefs.js');

export const resolvers = {
  ...documentResolvers,
  Mutation: {
    ...documentResolvers.Mutation,
    createDocument: catchResolverErrors(
      async (
        _,
        { userId, documentId, loanId, title, reference, link },
        { dataSources: { document }, username }: DocumentContext
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
            link,
            timestamp: Date.now(),
          },
        }),
      { fcnName: 'createDocument', logger, useAuth: true }
    ),
    updateDocument: async (
      _,
      { userId, documentId, loanId, title, reference, link },
      { dataSources: { document }, username }: DocumentContext
    ): Promise<Commit[] | { error: any }> => {
      // TODO: any[] is wrong typing. Need Fixing

      const result: any[] = [];
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
      if (typeof link !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo,
        })
          .DefineDocumentLink({
            userId,
            payload: { documentId, link, timestamp: Date.now() },
          })
          .then((data) => data)
          .catch((error) => new ApolloError(error));
        result.push(c);
      }
      return result;
    },
  },
};
