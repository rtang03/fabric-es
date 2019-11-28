import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';
import bodyParser from 'body-parser';
import Express from 'express';
import gql from 'graphql-tag';
import { createServer } from 'http';
import morgan from 'morgan';
import './env';

const PORT = process.env.PORT || 4000;
const gateway = new ApolloGateway({
  serviceList: [
    { name: 'loan', url: 'http://localhost:14001/graphql' },
    { name: 'document', url: 'http://localhost:14003/graphql' },
    { name: 'private', url: 'http://localhost:14002/graphql' },
    { name: 'user', url: 'http://localhost:14004/graphql' }
  ]
});
const typeDefs = gql`
  type Query {
    getPeerInfo: String!
  }
`;
const resolvers = {};

(async () => {
  const server = new ApolloServer({
    // typeDefs,
    // resolvers,
    gateway,
    subscriptions: false,
    context: async ({ req }) => {
      return {};
    }
  });
  const app = Express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(morgan('tiny'));
  server.applyMiddleware({ app });
  const httpServer = createServer(app);
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server at http://localhost:${PORT}${server.graphqlPath}`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
