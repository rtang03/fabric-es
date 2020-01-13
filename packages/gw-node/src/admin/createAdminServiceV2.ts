import { buildFederatedSchema } from '@apollo/federation';
import { ApolloServer } from 'apollo-server';
import Client from 'fabric-client';
import { FileSystemWallet } from 'fabric-network';
import { createResolversV2 } from './createResolversV2';
import { typeDefs } from './typeDefsV2';

export const createAdminServiceV2 = async ({
  channelName,
  ordererTlsCaCert,
  ordererName,
  peerName,
  caAdminEnrollmentId,
  connectionProfile,
  fabricNetwork,
  walletPath,
  asLocalhost = true,
  playground = true
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
}) => {
  // const logger = Client.getLogger('createAdminServiceV2');

  const resolvers = await createResolversV2({
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

  return new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground,
    context: ({ req: { headers } }) => ({
      user_id: headers.user_id,
      is_admin: headers.is_admin,
      client_id: headers.client_id,
      enrollmentId: headers.user_id
    })
  });
};
