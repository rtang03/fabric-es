import util from 'util';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { ApolloError } from 'apollo-server';
import { UriResolver } from './uriResolver';

export interface RemoteData {
  user_id?: string;
  is_admin?: string;
  client_id?: string;
  username?: string;
  uriResolver?: UriResolver;
  remoteData: (operation: {
    uri: string[];
    query: any;
    context?: any;
    operationName?: string;
    variables?: any;
    token?: string;
  }) => Promise<any[]>;
};

export const createRemoteData = ({ uri, query, variables, context, operationName, token, logger }) =>
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
);