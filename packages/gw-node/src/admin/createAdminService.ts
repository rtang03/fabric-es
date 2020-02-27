import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import Client from 'fabric-client';
import { FileSystemWallet } from 'fabric-network';
import { shutdown } from '../utils/shutdownApollo';
import { MISSING_CHANNELNAME, MISSING_CONNECTION_PROFILE, MISSING_FABRIC_NETWORK, MISSING_WALLET } from './constants';
import { createResolvers } from './createResolvers';
import { typeDefs } from './typeDefs';

export const createAdminService = async ({
  channelName,
  ordererTlsCaCert,
  ordererName,
  peerName,
  caAdminEnrollmentId,
  connectionProfile,
  fabricNetwork,
  walletPath,
  asLocalhost = true,
  playground = true,
  introspection = true
}: {
  channelName: string;
  ordererTlsCaCert: string;
  ordererName: string;
  peerName: string;
  caAdminEnrollmentId: string;
  connectionProfile: string;
  fabricNetwork: string;
  walletPath: string;
  asLocalhost?: boolean;
  playground?: boolean;
  introspection?: boolean;
}) => {
  const logger = Client.getLogger('createAdminService.js');

  if (!channelName) {
    logger.error(MISSING_CHANNELNAME);
    throw new Error(MISSING_CHANNELNAME);
  }
  if (!connectionProfile) {
    logger.error(MISSING_CONNECTION_PROFILE);
    throw new Error(MISSING_CONNECTION_PROFILE);
  }
  if (!fabricNetwork) {
    logger.error(MISSING_FABRIC_NETWORK);
    throw new Error(MISSING_FABRIC_NETWORK);
  }

  if (!walletPath) {
    logger.error(MISSING_WALLET);
    throw new Error(MISSING_WALLET);
  }

  const resolvers = await createResolvers({
    channelName,
    ordererTlsCaCert,
    ordererName,
    connectionProfile,
    fabricNetwork,
    peerName,
    caAdminEnrollmentId,
    wallet: new FileSystemWallet(walletPath),
    asLocalhost
  });

  logger.info('createResolvers complete');

  return {
    server: new ApolloServer({
      schema: buildFederatedSchema([{ typeDefs, resolvers }]),
      playground,
      introspection,
      context: ({ req: { headers } }) => ({
        user_id: headers.user_id,
        is_admin: headers.is_admin,
        client_id: headers.client_id,
        enrollmentId: headers.user_id
      })
    }),
    shutdown: shutdown({ logger, name: 'Admin' })
  };
};
