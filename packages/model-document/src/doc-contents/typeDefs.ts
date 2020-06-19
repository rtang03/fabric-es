import util from 'util';
import { Commit, TRACK_FIELD } from '@fabric-es/fabric-cqrs';
import { catchErrors, getLogger } from '@fabric-es/gateway-lib';
import gql from 'graphql-tag';
import { DocContents, docContentsCommandHandler, GET_CONTENTS_BY_ID } from '.';

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
    organization: [String]!
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
    mspId: String
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
    contents: [DocContents]
  }
`;

const logger = getLogger('doc-contents/typeDefs.js');

export const resolvers = {
  Query: {
    getDocContentsById: catchErrors(
      async (_, { documentId }, { dataSources: { docContents }, username }): Promise<DocContents> =>
        docContents.repo.getById({ id: documentId, enrollmentId: username }).then(({ currentState }) => currentState),
      { fcnName: 'getDocContentsById', logger, useAuth: false }
    )
  },
  Mutation: {
    createDocContents: catchErrors(
      async (
        _,
        { userId, documentId, content },
        { dataSources: { docContents }, username }
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
          enrollmentId: username,
          docContentsRepo: docContents.repo
        }).CreateDocContents({
          userId,
          payload: { documentId, content: val, timestamp: Date.now() }
        });
      },
      { fcnName: 'createDocContents', logger, useAuth: true }
    ),
    updateDocContents: catchErrors(
      async (
        _,
        { userId, documentId, content },
        { dataSources: { docContents }, username }
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
          enrollmentId: username,
          docContentsRepo: docContents.repo
        }).DefineDocContentsContent({
          userId,
          payload: { documentId, content: val, timestamp: Date.now() }
        });
      },
      { fcnName: 'updateDocContents', logger, useAuth: true }
    )
  },
  Document: {
    contents: catchErrors(
      async ({ documentId }, { token }, { dataSources: { organization, docContents, document }, username, mspId, remoteData }) => {
        const doc = await document.repo.getById({ id: documentId, enrollmentId: username }).then(({ currentState }) => currentState);
        const result = [];
        for (const mspid of doc[TRACK_FIELD][docContents.repo.getEntityName()]) {
          if (mspid === mspId) {
            result.push(await docContents.repo.getById({ id: documentId, enrollmentId: username }).then(({ currentState }) => currentState));
          } else {
            const org = await organization.repo.getById({ id: mspid, enrollmentId: username }).then(({ currentState }) => currentState);
            await remoteData({
              uri: org.url,
              query: GET_CONTENTS_BY_ID,
              operationName: 'GetDocContentsById',
              variables: { documentId },
              token
            }).then(({ data }) => {
              result.push(data?.getDocContentsById);
            }).catch(error => {
              logger.error(util.format('reemote data, %j', error));
            });
          }
        };
        return result;
      },
      { fcnName: 'Document/contents', logger, useAuth: false }
    )
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
