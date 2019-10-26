import { Trade, tradeCommandHandler } from '@espresso/common';
import { Commit } from '@espresso/fabric-cqrs';
import { Paginated, Resolvers } from '../../types';
import { TQuery } from '../types';

export const tradeResolver: Resolvers<TQuery, Trade> = {
  Query: {
    aboutTrade: () => 'Trade Entity',
    createTrade: async (
      _,
      { userId, title, tradeId, description },
      { dataSources: { tradeDataSource, userDataSource } }
    ): Promise<Commit> =>
      tradeCommandHandler({
        userRepo: userDataSource.repo,
        tradeRepo: tradeDataSource.repo
      }).CreateTrade({
        userId,
        payload: { tradeId, description, title, timestamp: Date.now() }
      }),
    getAllTrade: async (
      _,
      _args,
      {
        dataSources: {
          tradeDataSource: {
            repo: { getByEntityName }
          }
        }
      }
    ): Promise<Trade[] | { error: any }> =>
      getByEntityName()
        .then(({ entities }) => entities || [])
        .catch(error => ({ error })),
    getCommitByTradeId: async (
      _,
      { id },
      {
        dataSources: {
          tradeDataSource: {
            repo: { getCommitById }
          }
        }
      }
    ): Promise<Commit[] | { error: any }> =>
      getCommitById(id)
        .then(({ commits }) => commits || [])
        .catch(error => ({ error })),
    getPaginatedTrade: async (
      _,
      { cursor = 10 },
      {
        dataSources: {
          tradeDataSource: {
            repo: { getByEntityName }
          }
        }
      }
    ): Promise<Paginated<Trade> | { error: any }> =>
      getByEntityName()
        .then(
          ({ entities }: { entities: any[] }) =>
            ({
              entities: entities || [],
              hasMore: entities.length > cursor,
              total: entities.length
            } as Paginated<Trade>)
        )
        .catch(error => ({ error })),
    getTradeById: (
      _,
      { id },
      {
        dataSources: {
          tradeDataSource: {
            repo: { getById }
          }
        }
      }
    ): Promise<Trade | { error: any }> =>
      getById(id)
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Trade: {
    __resolveReference: (
      { tradeId },
      {
        dataSources: {
          tradeDataSource: {
            repo: { getById }
          }
        }
      }
    ) => getById(tradeId).then(({ currentState }) => currentState)
  }
};
