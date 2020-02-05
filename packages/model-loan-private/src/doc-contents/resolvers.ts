import { Commit } from '@espresso/fabric-cqrs';
import { AuthenticationError } from 'apollo-server-errors';
import {
  DocContents,
  docContentsCommandHandler,
  DocContentsDS,
} from '.';

const NOT_AUTHENICATED = 'no enrollment id';

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
