import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import Cookie from 'cookie';
import express, { Express } from 'express';
import morgan from 'morgan';
import fetch from 'node-fetch';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    if (context?.client_id)
      request.http.headers.set('client_id', context.client_id);
    if (context?.user_id) request.http.headers.set('user_id', context.user_id);
    if (context?.is_admin)
      request.http.headers.set('is_admin', context.is_admin);
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
      url: process.env.ADMINISTRATOR_URI || 'http://localhost:15000/graphql'
    },
    {
      name: 'remote-data',
      url: 'http://localhost:16000/graphql'
    }
  ],
  authenticationCheck = `${process.env.AUTHORIZATION_SERVER_URI ||
    'http://localhost:3300/oauth'}/authenticate`,
  useCors = false,
  corsOrigin = process.env.CORS || 'http://localhost:3000',
  debug = false
}) => {
  const gateway = new ApolloGateway({
    serviceList,
    buildService: ({ url }) => new AuthenticatedDataSource({ url }),
    debug
  });

  const server = new ApolloServer({
    gateway,
    subscriptions: false,
    context: async ({ req: { headers } }) => {
      const cookies = Cookie.parse((headers.cookie as string) || '');
      const token = cookies?.jid
        ? cookies.jid
        : headers?.authorization
        ? headers.authorization.split(' ')[1]
        : null;
      // todo: There are two options, for authenticationCheck.
      // Option 1: Below is a chatty authentication, which requires check, for every incoming request.
      // Option 2: Alternatively, we can stick to local JWT check, and decode.
      // We need to decide if we need option 2, at the same time.
      // One suggests: for admin access, use 1; for non-admin access, use 2
      // Option 2 has drawback, which peer-node demands ACCESS_TOKEN_SECRET
      // const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      return token
        ? fetch(authenticationCheck, {
            method: 'POST',
            headers: { authorization: `Bearer ${token}` }
          })
            .then<{
              ok: boolean;
              authenticated: boolean;
              user_id: string;
              is_admin: boolean;
              client_id: string;
            }>(res => res.json())
            .then(res => {
              if (res?.authenticated)
                return {
                  user_id: res.user_id,
                  is_admin: res.is_admin,
                  client_id: res.client_id
                };
              else {
                // e.g. res returns
                // { ok: false, authenticated: false, message: 'Invalid token: access token has expired' }
                return {};
              }
            })
            .catch(error => console.error(error))
        : {};
    }
  });
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(morgan('tiny'));
  if (useCors)
    server.applyMiddleware({
      app,
      cors: { origin: corsOrigin, credentials: true }
    });
  else server.applyMiddleware({ app });
  return app;
};
