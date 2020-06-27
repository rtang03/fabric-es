import { Commit, Paginated } from '@fabric-es/fabric-cqrs';
import { catchErrors, getLogger } from '@fabric-es/gateway-lib';
import { ApolloError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import { Document, documentCommandHandler } from '.';

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
    ): DocResponse
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
    _organization: [String]!
    loan: Loan
  }

  type PaginatedDocuments {
    items: [Document!]!
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
    mspId: String
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
  Query: {
    getCommitsByDocumentId: catchErrors(
      async (_, { documentId }, { dataSources: { document } }): Promise<Commit[]> =>
        document.repo.getCommitById({ id: documentId }).then(({ data }) => data || []),
      { fcnName: 'getCommitsByDocumentId', logger, useAuth: false }
    ),
    getDocumentById: catchErrors(
      async (_, { documentId }, { dataSources: { document }, username }): Promise<Document> =>
        document.repo
          .getById({ id: documentId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'getDocumentById', logger, useAuth: false }
    ),
    getPaginatedDocuments: catchErrors(
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
    searchDocumentByFields: catchErrors(
      async (_, { where }, { dataSources: { document } }): Promise<Document[]> =>
        document.repo.find({ byId: where }).then(({ data }) => Object.values(data)),
      { fcnName: 'searchDocumentByFields', logger, useAuth: false }
    ),
    searchDocumentContains: catchErrors(
      async (_, { contains }, { dataSources: { document } }): Promise<Document[]> =>
        document.repo.find({ byDesc: contains }).then(({ data }) => Object.values(data)),
      { fcnName: 'searchDocumentContains', logger, useAuth: false }
    ),
  },
  Mutation: {
    createDocument: catchErrors(
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
    deleteDocument: catchErrors(
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
    restrictAccess: catchErrors(
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
    documents: catchErrors(
      async ({ loanId }, _, { dataSources: { document } }) =>
        document.repo.find({ where: { loanId } }).then(({ data }) => data),
      { fcnName: 'Loan/docuemnts', logger, useAuth: false }
    ),
  },
  Document: {
    __resolveReference: catchErrors(
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
