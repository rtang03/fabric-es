require('./env');
import { createAdminServiceV2 } from '@espresso/gw-node';
import util from 'util';
import { getLogger } from './logger';

const port = process.env.ADMINISTRATOR_PORT || 15001;
const logger = getLogger('service-admin.js');

(async () => {
  const app = await createAdminServiceV2({
    ordererName: process.env.ORDERER_NAME,
    ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
    caAdminEnrollmentId: process.env.CA_ENROLLMENT_ID_ADMIN,
    channelName: process.env.CHANNEL_NAME,
    peerName: process.env.PEER_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    walletPath: process.env.WALLET
  });

  const shutdown = () =>
    app.stop().then(
      () => {
        logger.info('app closes');
        process.exit(0);
      },
      err => {
        logger.error(
          util.format('An error occurred while shutting down service: %j', err)
        );
        process.exit(1);
      }
    );

  process.on('SIGINT', async () => await shutdown());
  process.on('SIGTERM', async () => await shutdown());
  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  app.listen({ port }).then(({ url }) => {
    logger.info(`🚀 Admin Service ready at ${url}graphql`);
    process.send('ready');
  });
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
