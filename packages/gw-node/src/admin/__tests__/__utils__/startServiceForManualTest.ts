require('dotenv').config({
  path: require('path').resolve(__dirname, '../../../../.env.test')
});
import Client from 'fabric-client';
import { logger } from '../../..';
import { createAdminServiceV2 } from '../../createAdminServiceV2';

const port = 15000;

(async () => {
  Client.setLogger(logger);
  const server = await createAdminServiceV2({
    ordererName: process.env.ORDERER_NAME,
    ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
    channelName: process.env.CHANNEL_NAME,
    peerName: process.env.PEER_NAME,
    caAdminEnrollmentId: process.env.CA_ENROLLMENT_ID_ADMIN,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    walletPath: process.env.WALLET
  });
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Admin Service ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
