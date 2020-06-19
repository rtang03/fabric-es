import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import nodeFetch from 'node-fetch';
import { UriResolver } from './uriResolver';

const fetch = nodeFetch as any;

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

export const createRemoteData = ({ uri, query, variables, context, operationName, token }) =>
  makePromise(
    execute(
      new HttpLink({
        uri,
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
  );
