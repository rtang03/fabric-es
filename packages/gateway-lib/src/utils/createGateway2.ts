import util from 'util';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import Cookie from 'cookie';
import express, { Express } from 'express';
import httpStatus from 'http-status';
import fetch from 'node-fetch';
import { getLogger } from './getLogger';
import { isOauthResponse } from './typeGuard';

export class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    if (context?.client_id) request.http.headers.set('client_id', context.client_id);
    if (context?.user_id) request.http.headers.set('user_id', context.user_id);
    if (context?.is_admin) request.http.headers.set('is_admin', context.is_admin);
  }
}

export const createGateway: (option: {
  serviceList?: any;
  authenticationCheck?: string;
  useCors?: boolean;
  corsOrigin?: string;
  debug?: boolean;
}) => Promise<Express> = async ({
  serviceList = [
    {
      name: 'admin',
      url: 'http://localhost:15000/graphql'
    },
    {
      name: 'remote-data',
      url: 'http://localhost:16000/graphql'
    }
  ],
  authenticationCheck = 'http://localhost:8080/oauth/authenticate',
  useCors = false,
  corsOrigin = 'http://localhost:3000',
  debug = false
}) => {
  const logger = getLogger('[gw-lib] createGateway.js');

  const gateway = new ApolloGateway({
    serviceList,
    buildService: ({ url }) => new AuthenticatedDataSource({ url }),
    debug
  });

  const server = new ApolloServer({
    gateway,
    introspection: true,
    playground: true,
    subscriptions: false,
    context: async ({ req: { headers } }) => {
      const cookies = Cookie.parse(headers.cookie || '');
      const token = cookies?.jid ? cookies.jid : headers?.authorization ? headers.authorization.split(' ')[1] : null;

      if (!token) return {};

      try {
        const response = await fetch(authenticationCheck, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` }
        });

        if (response.status !== httpStatus.OK) {
          logger.warn(util.format('authenticate fails, %s', response.status));
          return {};
        }

        const result: unknown = await response.json();

        if (isOauthResponse(result)) return result;
        else {
          logger.warn(`fail to parse authenticationCheck result`);
          return {};
        }
      } catch (e) {
        logger.error(util.format('authenticationCheck error: %j', e));
        return {};
      }
    }
  });

  const app = express();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  if (useCors)
    server.applyMiddleware({
      app,
      cors: { origin: corsOrigin, credentials: true }
    });
  else server.applyMiddleware({ app });

  return app;
};
