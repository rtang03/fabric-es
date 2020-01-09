require('./env');
import { createAdminService } from '@espresso/gw-node';

const port = process.env.ADMINISTRATOR_PORT || 15001;

(async () => {
  const server = await createAdminService({
    channelName: process.env.CHANNEL_NAME,
    peerName: process.env.PEER_NAME,
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
