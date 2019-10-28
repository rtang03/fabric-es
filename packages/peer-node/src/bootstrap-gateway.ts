import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import express from 'express';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import jwks from 'jwks-rsa';
import morgan from 'morgan';
import './env';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request; context: any }) {
    // pass client_id to underlying service. For offchain resolvers, it needs
    // additional auth check, to be implementated in the resolver
    // see https://auth0.com/blog/develop-modern-apps-with-react-graphql-apollo-and-add-authentication/#Secure-your-GraphQL-API-with-Auth0
    request.http.headers.set('client_id', context.client_id);
  }
}

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'trade', url: 'http://localhost:14001/graphql' },
    // { name: 'document', url: 'http://localhost:14003/graphql' },
    // { name: 'privatedata', url: 'http://localhost:14002/graphql' }
  ],
  buildService: ({ url }) => new AuthenticatedDataSource({ url })
});

const PORT = process.env.PORT || 4000;

const client = jwks({
  jwksUri: `https://tangross.auth0.com/.well-known/jwks.json`
});

const getKey = (header, cb) =>
  client.getSigningKey(header.kid, (err, key: any) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    cb(null, signingKey);
  });

const options = {
  audience: 'urn:espresso',
  issuer: `https://tangross.auth0.com/`,
  algorithms: ['RS256']
};

const bootstrap = async () => {
  const server = new ApolloServer({
    gateway,
    subscriptions: false,
    context: async ({ req }) => {
      let client_id;
      let token = req.headers.authorization;
      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
        client_id = await new Promise((resolve, reject) =>
          jwt.verify(token, getKey, options, (err, decoded: any) =>
            err ? reject(err) : resolve(decoded.azp)
          )
        );
      }
      return { client_id };
    }
  });

  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(morgan('tiny'));
  server.applyMiddleware({ app });
  const httpServer = createServer(app);
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server at http://localhost:${PORT}${server.graphqlPath}`);
  });
};

bootstrap().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
