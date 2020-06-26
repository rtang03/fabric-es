import util from 'util';
import { buildFederatedSchema } from '@apollo/federation';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { ApolloError, ApolloServer } from 'apollo-server';
import nodeFetch from 'node-fetch';
import { getLogger } from '..';
import { shutdown } from '../utils';

const fetch = nodeFetch as any;

export interface RemoteData {
  user_id?: string;
  is_admin?: string;
  client_id?: string;
  username?: string;
  remoteData: (operation: {
    query: any;
    context?: any;
    operationName?: string;
    variables?: any;
    token?: string;
  }) => Promise<any[]>;
};

export const createRemoteService = async ({
  name,
  typeDefs,
  resolvers,
  urls,
}: {
  name: string;
  typeDefs: any;
  resolvers: any;
  urls: string[];
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
        remoteData: ({ query, variables, context, operationName, token }) =>
          Promise.all(
            urls.map((link) =>
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
