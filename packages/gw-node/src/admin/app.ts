import process from 'process';
import util from 'util';
import { createAdminServiceV2 } from '.';
import { getLogger } from '../utils/getLogger';

const app: any = {};
const port = (process.env.PORT || 8080) as number;

(async () => {
  const logger = getLogger('app.js');
  logger.info('starting admin-service...');

  const server = await createAdminServiceV2({
    ordererName: process.env.ORDERER_NAME,
    ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
    caAdminEnrollmentId: process.env.CA_ADMIN_ENROLLMENT_ID,
    channelName: process.env.CHANNEL_NAME,
    peerName: process.env.PEER_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    walletPath: process.env.WALLET_PATH
  });

  app.shutdown = () => {
    server.stop().catch(err => {
      logger.error(
        util.format('An error occurred while closing the server: %j', err)
      );
      process.exitCode = 1;
    });
    logger.info('server stop');
    process.exit();
  };

  process.on('SIGINT', () => {
    app.shutdown();
  });

  process.on('SIGTERM', () => {
    app.shutdown();
  });

  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Admin service started at ${url}graphql`);
    logger.info(`🚀 Admin service started at ${url}graphql`);
  });
})().catch(error => {
  console.error(error);
  process.exit();
});
