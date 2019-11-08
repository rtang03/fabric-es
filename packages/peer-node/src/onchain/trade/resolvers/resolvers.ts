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
      { dataSources: { tradeDataSource, userDataSource }, enrollmentId }
    ): Promise<Commit> =>
      tradeCommandHandler({
        enrollmentId,
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
        .then(({ data }) => data || [])
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
        .then(({ data }) => data || [])
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
          ({ data }: { data: any[] }) =>
            ({
              entities: data || [],
              hasMore: data.length > cursor,
              total: data.length
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
      getById({ id })
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
    ) => getById({ id: tradeId }).then(({ currentState }) => currentState)
  }
};
