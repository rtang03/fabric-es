import { Commit } from '@fabric-es/fabric-cqrs';
import { Paginated } from '@fabric-es/gateway-lib';
import { ApolloError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import { Document, documentCommandHandler, DocumentDS } from '.';

export const typeDefs = gql`
  type Query {
    getCommitsByDocumentId(documentId: String!): [DocCommit]!
    getDocumentById(documentId: String!): Document
    getPaginatedDocuments(pageSize: Int = 10): PaginatedDocuments!
    searchDocumentByFields(where: String!): [Document]
    searchDocumentContains(contains: String!): [Document]
  }

  type Mutation {
    createDocument(userId: String!, documentId: String!, loanId: String, title: String, reference: String!): DocResponse
    deleteDocument(userId: String!, documentId: String!): DocResponse
    restrictAccess(userId: String!, documentId: String!): DocResponse
    updateDocument(
      userId: String!
      documentId: String!
      loanId: String
      title: String
      reference: String
    ): [DocResponse]!
  }

  type Document @key(fields: "documentId") {
    documentId: String!
    ownerId: String!
    loanId: String
    title: String
    reference: String!
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
  Query: {
    getCommitsByDocumentId: async (
      _, { documentId }, { dataSources: { document } }: { dataSources: { document: DocumentDS }}
    ): Promise<Commit[]> =>
      document.repo.getCommitById(documentId)
        .then(({ data }) => data || [])
        .catch(error => new ApolloError(error)),
    getDocumentById: async (
      _, { documentId }, { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Document> =>
      document.repo.getById({ id: documentId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(error => new ApolloError(error)),
    getPaginatedDocuments: async (
      _, { pageSize }, { dataSources: { document } }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Paginated<Document>> =>
      document.repo.getByEntityName()
        .then(({ data }: { data: any[] }) => ({
          entities: data || [],
          total: data.length,
          hasMore: data.length > pageSize
        } as Paginated<Document>))
        .catch(error => new ApolloError(error)),
    searchDocumentByFields: async (
      _, { where }, { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Document[]> => {
      try {
        return document.repo.getProjection({ where: JSON.parse(where) })
          .then(({ data }) => data)
          .catch(error => new ApolloError(error));
      } catch (error) {
        throw new ApolloError(error);
      }
    },
    searchDocumentContains: async (
      _, { contains }, { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Document[]> =>
      document.repo.getProjection({ contain: contains })
        .then(({ data }) => data)
        .catch(error => new ApolloError(error))
  },
  Mutation: {
    createDocument: async (
      _, { userId, documentId, loanId, title, reference },
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
          timestamp: Date.now()
        }
      }).catch(error => {
        if (error.error.message) {
          return new ApolloError(error.error.message);
        } else {
          return new ApolloError(error);
        }
      }),
    deleteDocument: async (
      _, { userId, documentId },
      { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit> =>
      documentCommandHandler({
        enrollmentId,
        documentRepo: document.repo
      }).DeleteDocument({
          userId,
          payload: { documentId, timestamp: Date.now() }
      }).catch(error => {
        if (error.error.message) {
          return new ApolloError(error.error.message);
        } else {
          return new ApolloError(error);
        }
      }),
    restrictAccess: async (
      _, { userId, documentId },
      { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Commit> =>
      documentCommandHandler({
        enrollmentId,
        documentRepo: document.repo
      }).RestrictDocumentAccess({
        userId,
        payload: { documentId, timestamp: Date.now() }
      }).catch(error => new ApolloError(error)),
    updateDocument: async (
      _,
      { userId, documentId, loanId, title, reference },
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
          })
          .then(data => data)
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
          })
          .then(data => data)
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
          })
          .then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      return result;
    }
  },
  Loan: {
    documents: ({ loanId }, _, { dataSources: { document } }: { dataSources: { document: DocumentDS } }) =>
      document.repo
        .getProjection({ where: { loanId } })
        .then(({ data }) => data)
        .catch(error => new ApolloError(error))
  },
  Document: {
    __resolveReference: (
      { documentId },
      { dataSources: { document }, enrollmentId }: { dataSources: { document: DocumentDS }; enrollmentId: string }
    ): Promise<Document> =>
      document.repo
        .getById({ id: documentId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(error => new ApolloError(error)),
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  },
  DocResponse: {
    __resolveType: obj => (obj.commitId ? 'DocCommit' : obj.message ? 'DocError' : {})
  }
};
