import type { Commit, Counter, OutputCounter, Paginated } from '@fabric-es/fabric-cqrs';
import { ApolloError } from 'apollo-server';
import GraphQLJSON from 'graphql-type-json';
import { getLogger } from '../../utils';
import { catchResolverErrors } from '../../utils/catchResolverErrors';
import { commandHanlder } from './handler';
import type { Context } from './types';

const logger = getLogger('[gw-lib-test] resolvers.js');

export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    pingCounter: () => 'I am a simple counter',
    getCounter: catchResolverErrors(
      async (
        _,
        { counterId },
        {
          dataSources: {
            'gw-repo-counter': { repo },
          },
          username,
        }: Context
      ): Promise<Counter> =>
        repo
          .getById({ id: counterId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'getCounter', logger, useAuth: true, useAdmin: false }
    ),
    search: catchResolverErrors(
      async (
        _,
        { query }: { query: string },
        {
          dataSources: {
            'gw-repo-counter': { repo },
          },
        }: Context
      ): Promise<Paginated<OutputCounter>> => {
        const { data, error, status } = await repo.fullTextSearchEntity<OutputCounter>({
          entityName: 'gw-repo-counter',
          query,
          cursor: 0,
          pagesize: 10,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data;
      },
      { fcnName: 'search', logger, useAuth: true, useAdmin: false }
    ),
  },
  Mutation: {
    increment: catchResolverErrors(
      async (
        _,
        { counterId },
        {
          dataSources: {
            'gw-repo-counter': { repo },
          },
          user_id,
          username,
        }: Context
      ): Promise<Commit> =>
        commandHanlder({ enrollmentId: username, counterRepo: repo }).Increment({
          userId: user_id,
          payload: { id: counterId, tag: '', desc: '' },
        }),
      { fcnName: 'increment', logger, useAuth: true, useAdmin: false }
    ),
    decrement: catchResolverErrors(
      async (
        _,
        { counterId },
        {
          dataSources: {
            'gw-repo-counter': { repo },
          },
          user_id,
          username,
        }: Context
      ): Promise<Commit> =>
        commandHanlder({
          enrollmentId: username,
          counterRepo: repo,
        }).Decrement({ userId: user_id, payload: { id: counterId, tag: '', desc: '' } }),
      { fcnName: 'decrement', logger, useAuth: true, useAdmin: false }
    ),
  },
};
