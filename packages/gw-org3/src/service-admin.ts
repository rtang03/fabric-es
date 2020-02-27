require('./env');
import util from 'util';
import { createAdminService, getLogger } from '@espresso/gw-node';

const port = process.env.ADMINISTRATOR_PORT || 15002;
const logger = getLogger('service-admin.js');

(async () => {
  const { server, shutdown } = await createAdminService({
    ordererName: process.env.ORDERER_NAME,
    ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
    caAdminEnrollmentId: process.env.CA_ENROLLMENT_ID_ADMIN,
    channelName: process.env.CHANNEL_NAME,
    peerName: process.env.PEER_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    walletPath: process.env.WALLET
  });

  process.on('SIGINT', async () => await shutdown(server));
  process.on('SIGTERM', async () => await shutdown(server));
  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  server.listen({ port }).then(({ url }) => {
    logger.info(`🚀 Admin Service ready at ${url}graphql`);
    if (process.env.NODE_ENV === 'production') process.send('ready');
  });
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
