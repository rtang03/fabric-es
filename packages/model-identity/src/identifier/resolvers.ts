import type { Commit } from '@fabric-es/fabric-cqrs';
import { catchResolverErrors, getLogger } from '@fabric-es/gateway-lib';
import { UserInputError } from 'apollo-server';
import { ApolloError } from 'apollo-server-errors';
import GraphQLJSON from 'graphql-type-json';
import { IdentifierContext } from './types';

const logger = getLogger('identity/resolvers.js');

type Args = {
  [K in 'id']: string;
};

export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    isIdentifierAlive: () => 'have a great day',
    getVersion: catchResolverErrors(
      async (
        _,
        { id }: Args,
        {
          dataSources: {
            identifier: { repo },
          },
        }: IdentifierContext
      ): Promise<number> => {
        if (!id) throw new UserInputError('missing id');

        const { data, status, error } = await repo.getCommitById({ id });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data?.length;
      },
      { fcnName: 'get-version', logger, useAdmin: false, useAuth: false }
    ),
  },
  Mutation: {
    CreateIdentifier: catchResolverErrors(
      async (
        _,
        { id }: Args,
        {
          dataSources: {
            identifier: { repo },
          },
          username: enrollmentId,
        }: IdentifierContext
      ): Promise<Commit> => {
        if (!id) throw new UserInputError('missing id');

        return repo
          .create({ enrollmentId, id })
          .save({ events: [] })
          .then(({ data }) => data);
      },
      {
        fcnName: 'get-version',
        logger,
        useAdmin: false,
        useAuth: true,
      }
    ),
  },
};
