import { docCommandHandler, Document } from '@espresso/common';
import { Commit } from '@espresso/fabric-cqrs';
import { Paginated, Resolvers } from '../../types';
import { TQuery } from '../types';

export const resolvers: Resolvers<TQuery, Document> = {
  Query: {
    aboutDocument: () => 'Document Entity',
    createDocument: async (
      _,
      { description, documentId, link, title, tradeId, userId },
      { dataSources: { docDataSource, tradeDataSource, userDataSource } }
    ): Promise<Commit> =>
      docCommandHandler({
        docRepo: docDataSource.repo,
        tradeRepo: tradeDataSource.repo,
        userRepo: userDataSource.repo
      }).CreateDocument({
        userId,
        payload: {
          tradeId,
          documentId,
          description,
          link,
          title,
          timestamp: Date.now()
        }
      }),
    getAllDocument: async (
      _,
      _agrs,
      {
        dataSources: {
          docDataSource: {
            repo: { getByEntityName }
          }
        }
      }
    ): Promise<Document[] | { error: any }> =>
      getByEntityName().then(({ entities }) => entities || []),
    getCommitByDocumentId: async (
      _,
      { id },
      {
        dataSources: {
          docDataSource: {
            repo: { getCommitById }
          }
        }
      }
    ): Promise<Commit[] | { error: any }> =>
      getCommitById(id).then(({ commits }) => commits || []),
    getPaginatedDocument: async (
      _,
      { cursor = 10 },
      {
        dataSources: {
          docDataSource: {
            repo: { getByEntityName }
          }
        }
      }
    ): Promise<Paginated<Document> | { error: any }> =>
      getByEntityName().then(
        ({ entities }: { entities: any[] }) =>
          ({
            entities: entities || [],
            hasMore: entities.length > cursor,
            total: entities.length
          } as Paginated<Document>)
      ),
    getDocumentById: async (
      _,
      { id },
      {
        dataSources: {
          docDataSource: {
            repo: { getById }
          }
        }
      }
    ): Promise<Document> => getById(id).then(({ currentState }) => currentState)
  },
  Trade: {
    documents: (
      { tradeId },
      _args,
      {
        dataSources: {
          docDataSource: {
            repo: { getProjection }
          }
        }
      }
    ) =>
      getProjection({ where: { tradeId } }).then(
        ({ projections }) => projections
      )
  },
  Document: {
    __resolveReference: (
      { documentId },
      {
        dataSources: {
          docDataSource: {
            repo: { getById }
          }
        }
      }
    ): Promise<Document> =>
      getById(documentId).then(({ currentState }) => currentState)
  }
};
