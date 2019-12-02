require('./env');
import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import { FileSystemWallet } from 'fabric-network';
import { createResolvers, typeDefs } from './admin';

const port = 15000;

(async () => {
  console.log('♨️♨️ Bootstraping Peer Node API  ♨️♨️');
  const resolvers = await createResolvers({
    channelName: process.env.CHANNEL_NAME,
    peerName: process.env.PEER_NAME,
    context: {
      connectionProfile: process.env.CONNECTION_PROFILE,
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet: new FileSystemWallet(process.env.WALLET)
    }
  });
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
    console.log(`🚀 Server ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
