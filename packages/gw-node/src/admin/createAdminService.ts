import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import { FileSystemWallet } from 'fabric-network';
import { createResolvers } from './createResolvers';
import { typeDefs } from './typeDefs';

export const createAdminService = async () => {
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
  return new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    context: ({ req: { headers } }) => ({
      user_id: headers.user_id,
      is_admin: headers.is_admin,
      client_id: headers.client_id,
      enrollmentId: headers.user_id
    })
  });
};
