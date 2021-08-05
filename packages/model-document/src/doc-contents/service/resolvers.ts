import type { Commit } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger, queryRemoteData } from '@fabric-es/gateway-lib';
import { DocContents, DocContentsContext } from '..';
import { docContentsCommandHandler } from '../domain';
import { GET_CONTENTS_BY_ID } from '../query';

const logger = getLogger('doc-contents/resolvers.js');

export const resolvers = {
  Query: {
    getDocContentsById: catchResolverErrors(
      async (
        _,
        { documentId },
        {
          dataSources: { docContents: { repo }},
          username,
        }: DocContentsContext
      ) => {
        return repo
          .getById({ id: documentId, enrollmentId: username })
          .then(({ currentState }) => currentState);
      },
      { fcnName: 'getDocContentsById', logger, useAuth: true }
    ),
  },
  Mutation: {
    createDocContents: catchResolverErrors(
      async (
        _,
        { userId, documentId, content },
        {
          dataSources: {
            docContents: { repo },
          },
          username,
        }: DocContentsContext
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
          docContentsRepo: repo,
        }).CreateDocContents({
          userId,
          payload: { documentId, content: val, timestamp: Date.now() },
        });
      },
      { fcnName: 'createDocContents', logger, useAuth: true }
    ),
    updateDocContents: catchResolverErrors(
      async (
        _,
        { userId, documentId, content },
        {
          dataSources: {
            docContents: { repo },
          },
          username,
        }: DocContentsContext
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
          docContentsRepo: repo,
        }).DefineDocContentsContent({
          userId,
          payload: { documentId, content: val, timestamp: Date.now() },
        });
      },
      { fcnName: 'updateDocContents', logger, useAuth: true }
    ),
  },
  Document: {
    contents: catchResolverErrors(
      async ({ documentId }, _, context) =>
        queryRemoteData(
          DocContents, {
            id: documentId,
            context,
            query: GET_CONTENTS_BY_ID,
          }),
      { fcnName: 'Document/contents', logger, useAuth: false }
    ),
  },
  DocContents: {
    document: ({ documentId }) => ({ __typename: 'Document', documentId }),
  },
  Docs: {
    __resolveType: (obj) => (obj.body ? 'Data' : obj.format ? 'File' : {}),
  },
  PrvResponse: {
    __resolveType: (obj) =>
      obj.commitId ? 'PrvCommit' : obj.message ? 'SrvError' : {},
  },
};
