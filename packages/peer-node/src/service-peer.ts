import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import gql from 'graphql-tag';
import * as Listr from 'listr';
import './env';
import { Resolvers } from './generated/peer-resolvers-types';

const port = 15000;
const typeDefs = gql`
  type Query {
    getPeerInfo: PeerInfo!
  }
  type PeerInfo {
    name: String!
    url: String!
  }
`;

const resolvers: Resolvers = {
  Query: {
    getPeerInfo: () => Promise.resolve({ name: '', url: '' }),
  }
};

const bootstrap = async () => {
  console.log('♨️♨️ Bootstraping Peer Node API  ♨️♨️');
  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    context: ({ req }) => {
      return {
        enrollmentId: 'some'
      };
    }
  });
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
};

bootstrap().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
