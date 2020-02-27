require('../../../env');
import { createAdminService } from '../../createAdminService';

const port = process.env.ADMINISTRATOR_PORT;

(async () => {
  const { server } = await createAdminService({
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
    console.log(`🚀 admin Service for manual test at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
