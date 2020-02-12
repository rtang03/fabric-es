require('./env');
import { createAdminServiceV2 } from '@espresso/gw-node';

const port = process.env.ADMINISTRATOR_PORT || 15002;

(async () => {
  const server = await createAdminServiceV2({
    ordererName: process.env.ORDERER_NAME,
    ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
    caAdminEnrollmentId: process.env.CA_ENROLLMENT_ID_ADMIN,
    channelName: process.env.CHANNEL_NAME,
    peerName: process.env.PEER_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    walletPath: process.env.WALLET
  });
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Admin Service ready at ${url}graphql`);
    process.send('ready');
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
