import { Commit } from '@fabric-es/fabric-cqrs';
import { ApolloError } from 'apollo-server-errors';
import gql from 'graphql-tag';
import { DocContents, docContentsCommandHandler, DocContentsDS } from '.';

export const typeDefs = gql`
  type Query {
    getDocContentsById(documentId: String!): DocContents
  }

  type Mutation {
    createDocContents(userId: String!, documentId: String!, content: DocsInput!): DocContentsResp
    updateDocContents(userId: String!, documentId: String!, content: DocsInput!): DocContentsResp
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

  input DocsInput {
    body: String
    format: String
    link: String
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
      _, { documentId },
      { dataSources: { docContents }, enrollmentId }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ): Promise<DocContents> =>
      docContents.repo.getById({ id: documentId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(error => new ApolloError(error))
  },
  Mutation: {
    createDocContents: async (
      _, { userId, documentId, content },
      { dataSources: { docContents }, enrollmentId }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ): Promise<Commit> => {
      let val;
      if (content.body && !content.format && !content.link) {
        val = { body: content.body };
      } else if (!content.body && content.format && content.link) {
        val = { format: content.format, link: content.link };
      } else {
        val = {};
      }
      return docContentsCommandHandler({
        enrollmentId,
        docContentsRepo: docContents.repo
      }).CreateDocContents({
        userId,
        payload: { documentId, content: val, timestamp: Date.now() }
      }).catch(error => new ApolloError(error));
    },
    updateDocContents: async (
      _, { userId, documentId, content },
      { dataSources: { docContents }, enrollmentId }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ): Promise<Commit> => {
      let val;
      if (content.body && !content.format && !content.link) {
        val = { body: content.body };
      } else if (!content.body && content.format && content.link) {
        val = { format: content.format, link: content.link };
      } else {
        val = {};
      }
      return docContentsCommandHandler({
        enrollmentId,
        docContentsRepo: docContents.repo
      }).DefineDocContentsContent({
        userId,
        payload: { documentId, content: val, timestamp: Date.now() }
      }).catch(error => new ApolloError(error));
    }
  },
  Document: {
    contents: (
      { documentId },
      _,
      { dataSources: { docContents }, enrollmentId }: { dataSources: { docContents: DocContentsDS }; enrollmentId: string }
    ) =>
      docContents.repo.getById({ id: documentId, enrollmentId })
        .then(({ currentState }) => currentState)
        .catch(error => new ApolloError(error))
  },
  DocContents: {
    document: ({ documentId }) => ({ __typename: 'Document', documentId })
  },
  Docs: {
    __resolveType: obj => (obj.body ? 'Data' : obj.format ? 'File' : {})
  },
  DocContentsResp: {
    __resolveType: obj => (obj.commitId ? 'DocContentsCommit' : obj.message ? 'DocContentsError' : {})
  }
};
