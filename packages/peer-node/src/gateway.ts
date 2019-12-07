require('./env');
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import Cookie from 'cookie';
import express from 'express';
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

const gateway = new ApolloGateway({
  serviceList: [
    {
      name: 'admin',
      url: process.env.ADMINISTRATOR_URI || 'http://localhost:15000/graphql'
    }
  ],
  buildService: ({ url }) => new AuthenticatedDataSource({ url })
});

const PORT = process.env.PORT || 4000;
const authenticationCheck = `${process.env.AUTHORIZATION_SERVER_URI ||
  'http://localhost:3300/oauth'}/authenticate`;

(async () => {
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
            .then(res =>
              res?.authenticated
                ? {
                    user_id: res.user_id,
                    is_admin: res.is_admin,
                    client_id: res.client_id
                  }
                : {}
            )
        : {};
    }
  });
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(morgan('tiny'));
  server.applyMiddleware({
    app,
    cors: { origin: 'http://localhost:3000', credentials: true }
  });
  app.listen(PORT, () => {
    console.log(`🚀 Server at http://localhost:${PORT}${server.graphqlPath}`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
