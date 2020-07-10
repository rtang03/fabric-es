import util from 'util';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import express, { Express } from 'express';
import httpStatus from 'http-status';
import morgan from 'morgan';
import fetch from 'node-fetch';
import { getLogger } from './getLogger';
import { isAuthResponse } from './typeGuard';

export class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    if (context?.username) request.http.headers.set('username', context.username);
    if (context?.user_id) request.http.headers.set('user_id', context.user_id);
    if (context?.is_admin) request.http.headers.set('is_admin', context.is_admin);
  }
}

export const createGateway: (option: {
  serviceList?: any;
  authenticationCheck: string;
  useCors?: boolean;
  corsOrigin?: string;
  debug?: boolean;
}) => Promise<Express> = async ({
  serviceList = [
    {
      name: 'admin',
      url: 'http://localhost:15000/graphql',
    },
    {
      name: 'remote-data',
      url: 'http://localhost:16000/graphql',
    },
  ],
  authenticationCheck,
  useCors = false,
  corsOrigin = '',
  debug = false,
}) => {
  const logger = getLogger('[gw-lib] createGateway.js');

  const gateway = new ApolloGateway({
    serviceList,
    buildService: ({ url }) => new AuthenticatedDataSource({ url }),
    debug,
  });

  const server = new ApolloServer({
    gateway,
    introspection: true,
    playground: true,
    subscriptions: false,
    context: async ({ req: { headers } }) => {
      const token = headers?.authorization?.split(' ')[1] || null;

      if (!token) return {};

      try {
        const response = await fetch(authenticationCheck, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        });

        if (response.status !== httpStatus.OK) {
          logger.warn(`authenticate fails, status: ${response.status}`);
          return {};
        }

        const result: unknown = await response.json();

        if (isAuthResponse(result)) {
          return result;
        } else {
          logger.warn(`fail to parse authenticationCheck result`);
          return {};
        }
      } catch (e) {
        logger.error(util.format('authenticationCheck error: %j', e));
        return {};
      }
    },
  });

  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(morgan('dev'));

  app.get('/gw_org/isalive', (_, res) => res.status(204).send({ data: 'hi' }));

  // Note: this cors implementation is redundant. Cors should be check at ui-account's express backend
  // However, if there is alternative implementation, other than custom backend of SSR; there may require
  // cors later on.
  if (useCors)
    server.applyMiddleware({
      app,
      cors: { origin: corsOrigin, credentials: true },
    });
  else server.applyMiddleware({ app });

  return app;
};
