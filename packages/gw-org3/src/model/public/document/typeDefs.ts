import { Commit } from '@espresso/fabric-cqrs';
import { documentResolvers } from '@espresso/model-loan';
import { ApolloError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import { documentCommandHandler, DocumentDS } from '.';

export const typeDefs = gql`
  type Query {
    getCommitsByDocumentId(documentId: String!): [DocCommit]!
    getDocumentById(documentId: String!): Document
    getPaginatedDocuments(pageSize: Int = 10): PaginatedDocuments!
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

export const resolvers = {
  ...documentResolvers,
  Mutation: {
    ...documentResolvers.Mutation,
    createDocument: async (
      _, { userId, documentId, loanId, title, reference, link },
      { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit> =>
      documentCommandHandler({
        enrollmentId,
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
          }})
        .catch(error => new ApolloError(error)),
    updateDocument: async (
      _, { userId, documentId, loanId, title, reference, link },
      { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit[] | { error: any }> => {
      const result: Commit[] = [];
      if (typeof loanId !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId,
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
          enrollmentId,
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
          enrollmentId,
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
          enrollmentId,
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
