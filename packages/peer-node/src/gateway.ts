require('./env');
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import fetch from 'node-fetch';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    request.http.headers.set('client_id', context.client_id);
    request.http.headers.set('user_id', context.user_id);
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
    context: async ({ req: { headers } }) =>
      headers?.authorization
        ? fetch(authenticationCheck, {
            method: 'POST',
            headers: {
              authorization: `Bearer ${headers.authorization.split(' ')[1]}`
            }
          })
            .then<{ ok: boolean; authenticated: boolean; user_id: string }>(
              res => res.json()
            )
            .then(res => (res?.authenticated ? res?.user_id : null))
            .then(user_id => ({ user_id }))
        : {}
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
