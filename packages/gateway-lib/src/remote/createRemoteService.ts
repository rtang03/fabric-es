import util from 'util';
import { buildFederatedSchema } from '@apollo/federation';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { ApolloError, ApolloServer } from 'apollo-server';
import nodeFetch from 'node-fetch';
import { getLogger } from '..';
import { shutdown } from '../utils';
import { RemoteData } from './remoteData';
import { UriResolver } from './uriResolver';

const fetch = nodeFetch as any;

export const createRemoteService = async ({
  name,
  typeDefs,
  resolvers,
  uriResolver,
}: {
  name: string;
  typeDefs: any;
  resolvers: any;
  uriResolver: UriResolver;
}) => {
  const logger = getLogger('createRemoteService');

  logger.info(`♨️♨️ Bootstraping Remote Data API - ${name} ♨️♨️`);

  return {
    server: new ApolloServer({
      schema: buildFederatedSchema({
        typeDefs,
        resolvers,
      }),
      playground: true,
      context: ({ req: { headers } }): RemoteData => ({
        user_id: headers.user_id as string,
        is_admin: headers.is_admin as string,
        username: headers.username as string,
        uriResolver,
        remoteData: ({ uri, query, variables, context, operationName, token }) =>
          Promise.all(
            uri.map((link) =>
              makePromise(
                execute(
                  new HttpLink({
                    uri: link,
                    fetch,
                    headers: { authorization: `Bearer ${token}` },
                  }),
                  {
                    query,
                    variables,
                    operationName,
                    context,
                  }
                )
              ).catch((error) => {
                logger.error(util.format('executeHttpLink, %j', error));
                return new ApolloError(error);
              })
            )
          ),
      }),
    }),
    shutdown: shutdown({ logger, name }),
  };
};
