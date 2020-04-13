import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import { Wallets } from 'fabric-network';
import { getLogger } from '..';
import { shutdown } from '../utils/shutdownApollo';
import { MISSING_CHANNELNAME, MISSING_CONNECTION_PROFILE, MISSING_FABRIC_NETWORK, MISSING_WALLET } from './constants';
import { createResolvers } from './createResolvers';
import { typeDefs } from './typeDefs';

export const createAdminService: (option: {
  caAdmin: string;
  caAdminPW: string;
  channelName: string;
  ordererTlsCaCert: string;
  ordererName: string;
  peerName: string;
  connectionProfile: string;
  fabricNetwork: string;
  walletPath: string;
  asLocalhost?: boolean;
  playground?: boolean;
  introspection?: boolean;
  mspId: string;
}) => Promise<{ server: ApolloServer; shutdown: any }> = async ({
  caAdmin,
  caAdminPW,
  channelName,
  ordererTlsCaCert,
  ordererName,
  peerName,
  connectionProfile,
  fabricNetwork,
  walletPath,
  mspId,
  asLocalhost = true,
  playground = true,
  introspection = true
}) => {
  const logger = getLogger('[gw-lib] createAdminService.js');

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
    caAdmin,
    caAdminPW,
    channelName,
    ordererTlsCaCert,
    ordererName,
    connectionProfile,
    fabricNetwork,
    peerName,
    wallet: await Wallets.newFileSystemWallet(walletPath),
    asLocalhost,
    mspId
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
