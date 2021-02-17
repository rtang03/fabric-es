import type { Commit, Paginated } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { userCommandHandler } from './domain';
import type { User, ApolloContext } from './types';
import { ApolloError } from 'apollo-server-errors';

const logger = getLogger('user/typeDefs.js');

export const resolvers = {
  Query: {
    me: () =>
      Promise.resolve({
        userId: 'ADMIN001',
        name: 'Admin',
        mergedUserIds: [],
      }),
    getCommitsByUserId: catchResolverErrors(
      async (_, { userId }, { dataSources: { user } }: ApolloContext): Promise<Commit[]> =>
        user.repo.getCommitById(userId).then(({ data }) => data || []),
      { fcnName: 'getCommitsByUserId', logger, useAuth: false }
    ),
    getPaginatedUser: catchResolverErrors(
      async (
        _,
        { cursor, pageSize }: { cursor: number; pageSize: number },
        {
          dataSources: {
            user: { repo },
          },
        }: ApolloContext
      ): Promise<Paginated<User>> => {
        const { data, status, error } = await repo.fullTextSearchEntity<User>({
          entityName: 'user',
          query: '',
          cursor: cursor ?? 0,
          pagesize: pageSize,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data;
      },
      { fcnName: 'getPaginatedUser', logger, useAuth: false }
    ),
    getUserById: catchResolverErrors(
      async (
        _,
        { userId }: { userId: string },
        {
          dataSources: {
            user: { repo },
          },
          username,
        }: ApolloContext
      ): Promise<User> => {
        const { data, status, error } = await repo.fullTextSearchEntity<User>({
          entityName: 'document',
          query: `@id:${userId}`,
          cursor: 0,
          pagesize: 1,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items[0];
      },
      { fcnName: 'getUserById', logger, useAuth: true }
    ),
    searchUserByFields: catchResolverErrors(
      async (
        _,
        { where }: { where: string },
        {
          dataSources: {
            user: { repo },
          },
          username,
        }: ApolloContext
      ): Promise<User[]> => {
        const whereJSON = JSON.parse(where);
        const [key, value] = Object.entries(whereJSON)[0];
        const { data, status, error } = await repo.fullTextSearchEntity<User>({
          entityName: 'user',
          query: `@${key}:${value}*`,
          cursor: 0,
          pagesize: 100,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items || [];
      },
      { fcnName: 'searchUserByFields', logger, useAuth: false }
    ),
    searchUserContains: catchResolverErrors(
      async (
        _,
        { contains },
        {
          dataSources: {
            user: { repo },
          },
        }: ApolloContext
      ): Promise<User[]> => {
        const { data, status, error } = await repo.fullTextSearchEntity<User>({
          entityName: 'user',
          query: `@name:${contains}*`,
          cursor: 0,
          pagesize: 100,
        });
        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.items || [];
      },
      { fcnName: 'searchUserContains', logger, useAuth: false }
    ),
  },
  Mutation: {
    createUser: catchResolverErrors(
      async (
        _,
        { name, userId },
        { dataSources: { user }, username }: ApolloContext
      ): Promise<Commit> =>
        userCommandHandler({
          enrollmentId: username,
          userRepo: user.repo,
        }).CreateUser({
          userId,
          payload: { name, timestamp: Date.now() },
        }),
      { fcnName: 'createUser', logger, useAuth: false }
    ),
  },
  UserResponse: {
    __resolveType: (obj: any) => (obj.commitId ? 'UserCommit' : obj.message ? 'UserError' : null),
  },
};
