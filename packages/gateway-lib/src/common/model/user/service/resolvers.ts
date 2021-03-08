import type { Commit, Paginated } from '@fabric-es/fabric-cqrs';
import { ApolloError } from 'apollo-server-errors';
import { userCommandHandler } from '..';
import type { User, UserContext } from '..';
import { catchResolverErrors } from '../../../..';
import { getLogger } from '../../../../utils';

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
      async (
        _,
        { userId }: { userId: string },
        {
          dataSources: {
            user: { repo },
          },
        }: UserContext
      ): Promise<Commit[]> => repo.getCommitById({ id: userId }).then(({ data }) => data || []),
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
        }: UserContext
      ): Promise<Paginated<User>> => {
        const { data, status, error } = await repo.fullTextSearchEntity({
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
        }: UserContext
      ): Promise<User> => {
        const { data, status, error } = await repo.fullTextSearchEntity({
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
        }: UserContext
      ): Promise<User[]> => {
        const whereJSON = JSON.parse(where);
        const [key, value] = Object.entries(whereJSON)[0];
        const { data, status, error } = await repo.fullTextSearchEntity({
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
        }: UserContext
      ): Promise<User[]> => {
        const { data, status, error } = await repo.fullTextSearchEntity({
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
        { name, userId }: { name: string; userId: string },
        { dataSources: { user }, username }: UserContext
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
