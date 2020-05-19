import { Commit } from '@fabric-es/fabric-cqrs';
import { catchErrors, getLogger } from '@fabric-es/gateway-lib';
import { documentResolvers } from '@fabric-es/model-document';
import { ApolloError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import { documentCommandHandler } from './handler';
import { DocumentDS } from '.';

export const typeDefs = gql`
  type Query {
    getCommitsByDocumentId(documentId: String!): [DocCommit]!
    getDocumentById(documentId: String!): Document
    getPaginatedDocuments(pageSize: Int = 10): PaginatedDocuments!
    searchDocumentByFields(where: String!): [Document]
    searchDocumentContains(contains: String!): [Document]
  }

  type Mutation {
    createDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String!
      link: String!
    ): DocResponse
    deleteDocument(userId: String!, documentId: String!): DocResponse
    restrictAccess(userId: String!, documentId: String!): DocResponse
    updateDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String
      link: String
    ): [DocResponse]!
  }

  type Document @key(fields: "documentId") {
    documentId: String!
    ownerId: String!
    loanId: String
    title: String
    reference: String!
    link: String
    status: Int!
    timestamp: String!
    loan: Loan
  }

  type PaginatedDocuments {
    entities: [Document!]!
    total: Int!
    hasMore: Boolean!
  }

  extend type Loan @key(fields: "loanId") {
    loanId: String! @external
    documents: [Document]
  }

  union DocResponse = DocCommit | DocError

  type DocEvent {
    type: String
  }

  type DocCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
    events: [DocEvent!]
  }

  type DocError {
    message: String!
    stack: String
  }
`;

const logger = getLogger('document/typeDefs.js');

export const resolvers = {
  ...documentResolvers,
  Mutation: {
    ...documentResolvers.Mutation,
    createDocument: catchErrors(async (
      _, { userId, documentId, loanId, title, reference, link },
      { dataSources: { document }, username }: { dataSources: { document: DocumentDS }; username: string }
    ): Promise<Commit> =>
      documentCommandHandler({
        enrollmentId: username,
        documentRepo: document.repo
      }).CreateDocument({
          userId,
          payload: {
            documentId,
            loanId,
            title,
            reference,
            link,
            timestamp: Date.now()
          }}), { fcnName: 'createDocument', logger, useAuth: true }),
    updateDocument: async (
      _, { userId, documentId, loanId, title, reference, link },
      { dataSources: { document }, username }: { dataSources: { document: DocumentDS }; username: string }
    ): Promise<Commit[] | { error: any }> => {
      const result: Commit[] = [];
      if (typeof loanId !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo
        }).DefineDocumentLoanId({
            userId,
            payload: { documentId, loanId, timestamp: Date.now() }
        }).then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      if (typeof title !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo
        }).DefineDocumentTitle({
            userId,
            payload: { documentId, title, timestamp: Date.now() }
        }).then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      if (typeof reference !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo
        }).DefineDocumentReference({
            userId,
            payload: { documentId, reference, timestamp: Date.now() }
        }).then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      if (typeof link !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo
        }).DefineDocumentLink({
            userId,
            payload: { documentId, link, timestamp: Date.now() }
        }).then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      return result;
    }
  }
};
