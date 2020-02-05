// import { buildFederatedSchema } from '@apollo/federation';
// import { ApolloServer } from 'apollo-server';
// import { FileSystemWallet } from 'fabric-network';
// import { createResolvers } from './createResolvers';
// import { typeDefs } from './typeDefs';
//
// export const createAdminService = async ({
//   channelName, peerName, connectionProfile, fabricNetwork, walletPath
// }: {
//   channelName: string;
//   peerName: string;
//   connectionProfile: string;
//   fabricNetwork: string;
//   walletPath: string;
// }) => {
//   console.log('♨️♨️  Bootstraping administration micro-service  ♨️♨️');
//   const resolvers = await createResolvers({
//     channelName,
//     peerName,
//     context: {
//       connectionProfile,
//       fabricNetwork,
//       wallet: new FileSystemWallet(walletPath)
//     }
//   });
//   return new ApolloServer({
//     schema: buildFederatedSchema([{ typeDefs, resolvers }]),
//     playground: true,
//     context: ({ req: { headers } }) => ({
//       user_id: headers.user_id,
//       is_admin: headers.is_admin,
//       client_id: headers.client_id,
//       enrollmentId: headers.user_id
//     })
//   });
// };
