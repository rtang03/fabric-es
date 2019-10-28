import { User, userCommandHandler } from '@espresso/common';
import { Commit } from '@espresso/fabric-cqrs';
import { Paginated, Resolvers } from '../../types';
import { TQuery } from '../types';

export const userResolver: Resolvers<TQuery, User> = {
  Query: {
    aboutUser: () => 'User Entity',
    me: () =>
      Promise.resolve({
        userId: 'ADMIN001',
        name: 'Admin',
        mergedUserIds: []
      }),
    createUser: async (
      _,
      { name, userId },
      { dataSources: { userDataSource, tradeDataSource } }
    ): Promise<Commit> =>
      userCommandHandler({
        userRepo: userDataSource.repo,
        tradeRepo: tradeDataSource.repo
      }).CreateUser({
        userId,
        payload: { name, timestamp: Date.now() }
      }),
    getAllUser: async (
      _,
      _args,
      {
        dataSources: {
          userDataSource: {
            repo: { getByEntityName }
          }
        }
      }
    ): Promise<User[] | { error: any }> =>
      getByEntityName()
        .then(({ data }) => data || [])
        .catch(error => ({ error })),
    getCommitByUserId: async (
      _,
      { id },
      {
        dataSources: {
          userDataSource: {
            repo: { getCommitById }
          }
        }
      }
    ): Promise<Commit[] | { error: any }> =>
      getCommitById(id)
        .then(({ data }) => data || [])
        .catch(error => ({ error })),
    getPaginatedUser: async (
      _,
      { cursor = 10 },
      {
        dataSources: {
          userDataSource: {
            repo: { getByEntityName }
          }
        }
      }
    ): Promise<Paginated<User> | { error: any }> =>
      getByEntityName()
        .then(
          ({ data }: { data: any[] }) =>
            ({
              entities: data || [],
              hasMore: data.length > cursor,
              total: data.length
            } as Paginated<User>)
        )
        .catch(error => ({ error })),
    getUserById: async (
      _,
      { id },
      {
        dataSources: {
          userDataSource: {
            repo: { getById }
          }
        }
      }
    ): Promise<User | { error: any }> =>
      getById(id)
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  }
};
