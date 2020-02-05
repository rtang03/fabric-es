import { Commit } from '@espresso/fabric-cqrs';
import { AuthenticationError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import {
  DocContents,
  docContentsCommandHandler,
  DocContentsDS,
} from '.';

const NOT_AUTHENICATED = 'no enrollment id';

export const typeDefs = gql`
  type Query {
    getDocContentsById(documentId: String!): DocContents
  }

  type Mutation {
    createDataDocContents(userId: String!, documentId: String!, body: String!): DocContentsResp
    createFileDocContents(userId: String!, documentId: String!, format: String!, link: String!): DocContentsResp
  }

  ###
  # Local Type: Doc Contents
  ###
  type DocContents @key(fields: "documentId") {
    documentId: String!
    content: Docs!
    timestamp: String!
    document: Document
  }

  union Docs = Data | File

  # Free style document content as structural data
  type Data {
    body: String!
  }

  # Note: this File entity is Private Data, but the uploaded files themselves are entirly off-chain
  type File {
    format: String!
    link: String!
  }

  ###
  # Mutation responses
  ###
  union DocContentsResp = DocContentsCommit | DocContentsError

  type DocContentsCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
  }

  type DocContentsError {
    message: String!
    stack: String
  }

  ###
  # Federated types
  ###
  extend type Document @key(fields: "documentId") {
    documentId: String! @external
    contents: DocContents
  }
`;

export const resolvers = {
  Query: {
    getDocContentsById: async (
      _,
      { documentId },
      {
        dataSources: { docContents },
        enrollmentId
      }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ): Promise<DocContents> =>
      docContents.repo
        .getById({ id: documentId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => error)
  },
  Mutation: {
    createDataDocContents: async (
      _,
      { userId, documentId, body },
      {
        dataSources: { docContents },
        enrollmentId
      }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : docContentsCommandHandler({
            enrollmentId,
            docContentsRepo: docContents.repo
          })
            .CreateDocContents({
              userId,
              payload: { documentId, content: { body }, timestamp: Date.now() }
            })
            .catch(({ error }) => error),
    createFileDocContents: async (
      _,
      { userId, documentId, format, link },
      {
        dataSources: { docContents },
        enrollmentId
      }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ): Promise<Commit> =>
      !enrollmentId
        ? new AuthenticationError(NOT_AUTHENICATED)
        : docContentsCommandHandler({
            enrollmentId,
            docContentsRepo: docContents.repo
          })
            .CreateDocContents({
              userId,
              payload: {
                documentId,
                content: { format, link },
                timestamp: Date.now()
              }
            })
            .catch(({ error }) => error)
  },
  Document: {
    contents: (
      { documentId },
      _,
      {
        dataSources: { docContents },
        enrollmentId
      }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ) =>
      docContents.repo
        .getById({ id: documentId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(({ error }) => error)
  },
  DocContents: {
    document: ({ documentId }) => ({ __typename: 'Document', documentId })
  },
  Docs: {
    __resolveType: obj => (obj.body ? 'Data' : obj.format ? 'File' : {})
  },
  DocContentsResp: {
    __resolveType: obj =>
      obj.commitId ? 'DocContentsCommit' : obj.message ? 'DocContentsError' : {}
  }
};
