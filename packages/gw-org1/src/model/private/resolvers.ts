import { Commit } from '@espresso/fabric-cqrs';
import { DocContents, docContentsCommandHandler, DocContentsDS } from '.';

export const resolvers = {
  Query: {
    getDocContentsById: async (
      _, { documentId }, { dataSources: { docContents }}: { dataSources: { docContents: DocContentsDS }}
    ): Promise<DocContents | { error: any }> =>
      docContents.repo.getById({ id: documentId })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Mutation: {
    createDataDocContents: async (
      _, { userId, documentId, body }, { dataSources: { docContents }, enrollmentId }: { dataSources: { docContents: DocContentsDS }, enrollmentId: string }
    ): Promise<Commit> =>
      docContentsCommandHandler({ enrollmentId, docContentsRepo: docContents.repo }).CreateDocContents({
        userId,
        payload: { documentId, content: { body }, timestamp: Date.now() }
      }),
    createFileDocContents: async (
      _, { userId, documentId, format, link }, { dataSources: { docContents }, enrollmentId }: { dataSources: { docContents: DocContentsDS }, enrollmentId: string }
    ): Promise<Commit> =>
      docContentsCommandHandler({ enrollmentId, docContentsRepo: docContents.repo }).CreateDocContents({
        userId,
        payload: { documentId, content: { format, link }, timestamp: Date.now() }
      }),
  },
  Document: {
    contents: (document, _, { dataSources: { docContents }}: { dataSources: { docContents: DocContentsDS }}) => {
      return docContents.repo.getById({ id: document.documentId })
        .then(({ currentState }) => currentState);
    }
  },
  DocContents: {
    document(contents) {
      return { __typename: 'Document', documentId: contents.documentId };
    }
  },
  Docs: {
    __resolveType(obj, _, __) {
      if (obj.body) {
        return 'Data';
      }
      if (obj.format) {
        return 'File';
      }
      return {};
    }
  },
  LocalResponse: {
    __resolveType(obj, _, __) {
      if (obj.commitId) {
        return 'LocalCommit';
      }
      if (obj.message) {
        return 'LocalError';
      }
      return {};
    }
  }
};
