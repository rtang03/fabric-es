import { Commit } from '@fabric-es/fabric-cqrs';
import { catchErrors, getLogger, Paginated } from '@fabric-es/gateway-lib';
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

type Context = { dataSources: { document: DocumentDS }; username: string };

const logger = getLogger('document/typeDefs.js');

export const resolvers = {
  Query: {
    getCommitsByDocumentId: catchErrors(
      async (_, { documentId }, { dataSources: { document } }: Context): Promise<Commit[]> =>
        document.repo.getCommitById(documentId).then(({ data }) => data || []),
      { fcnName: 'getCommitsByDocumentId', logger, useAuth: false }
    ),
    getDocumentById: catchErrors(
      async (_, { documentId }, { dataSources: { document }, username }: Context): Promise<Document> =>
        document.repo.getById({ id: documentId, enrollmentId: username }).then(({ currentState }) => currentState),
      { fcnName: 'getDocumentById', logger, useAuth: false }
    ),
    getPaginatedDocuments: catchErrors(
      async (_, { pageSize }, { dataSources: { document } }: Context): Promise<Paginated<Document>> =>
        document.repo.getByEntityName().then(
          ({ data }: { data: any[] }) =>
            ({
              entities: data || [],
              total: data.length,
              hasMore: data.length > pageSize
            } as Paginated<Document>)
        ),
      { fcnName: 'getPaginatedDocuments', logger, useAuth: false }
    ),
    searchDocumentByFields: catchErrors(
      async (_, { where }, { dataSources: { document } }: Context): Promise<Document[]> =>
        document.repo.getProjection({ where: JSON.parse(where) }).then(({ data }) => data),
      { fcnName: 'searchDocumentByFields', logger, useAuth: false }
    ),
    searchDocumentContains: catchErrors(
      async (_, { contains }, { dataSources: { document } }: Context): Promise<Document[]> =>
        document.repo.getProjection({ contain: contains }).then(({ data }) => data),
      { fcnName: 'searchDocumentContains', logger, useAuth: false }
    )
  },
  Mutation: {
    createDocument: catchErrors(
      async (
        _,
        { userId, documentId, loanId, title, reference },
        { dataSources: { document }, username }: Context
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
            timestamp: Date.now()
          }
        }),
      { fcnName: 'createDocument', logger, useAuth: true }
    ),
    deleteDocument: catchErrors(
      async (_, { userId, documentId }, { dataSources: { document }, username }: Context): Promise<Commit> =>
        documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo
        }).DeleteDocument({
          userId,
          payload: { documentId, timestamp: Date.now() }
        }),
      { fcnName: 'deleteDocument', logger, useAuth: true }
    ),
    restrictAccess: catchErrors(
      async (_, { userId, documentId }, { dataSources: { document }, username }: Context): Promise<Commit> =>
        documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo
        }).RestrictDocumentAccess({
          userId,
          payload: { documentId, timestamp: Date.now() }
        }),
      { fcnName: 'restrictAccess', logger, useAuth: true }
    ),
    updateDocument: async (
      _,
      { userId, documentId, loanId, title, reference },
      { dataSources: { document }, username }: Context
    ): Promise<Commit[]> => {
      const result: Commit[] = [];
      if (typeof loanId !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo
        })
          .DefineDocumentLoanId({
            userId,
            payload: { documentId, loanId, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      if (typeof title !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo
        })
          .DefineDocumentTitle({
            userId,
            payload: { documentId, title, timestamp: Date.now() }
          })
          .then(data => data)
          .catch(error => new ApolloError(error));
        result.push(c);
      }
      if (typeof reference !== 'undefined') {
        const c = await documentCommandHandler({
          enrollmentId: username,
          documentRepo: document.repo
        })
          .DefineDocumentReference({
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
    documents: catchErrors(
      async ({ loanId }, _, { dataSources: { document } }: Context) =>
        document.repo.getProjection({ where: { loanId } }).then(({ data }) => data),
      { fcnName: 'Loan/docuemnts', logger, useAuth: false }
    )
  },
  Document: {
    __resolveReference: catchErrors(
      async ({ documentId }, { dataSources: { document }, username }: Context): Promise<Document> =>
        document.repo.getById({ id: documentId, enrollmentId: username }).then(({ currentState }) => currentState),
      { fcnName: 'Document/__resolveReference', logger, useAuth: false }
    ),
    loan: ({ loanId }) => ({ __typename: 'Loan', loanId })
  },
  DocResponse: {
    __resolveType: obj => (obj.commitId ? 'DocCommit' : obj.message ? 'DocError' : {})
  }
};
