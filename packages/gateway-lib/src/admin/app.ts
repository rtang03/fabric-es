import { getLogger } from '..';
import { shutdown } from '../utils/shutdownApollo';
import { createAdminService } from '.';

const port = (process.env.PORT || 8080) as number;

(async () => {
  const logger = getLogger('[gw-lib] app.js');
  logger.info('starting admin-service...');

  const { server } = await createAdminService({
    caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
    caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
    ordererName: process.env.ORDERER_NAME,
    ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
    channelName: process.env.CHANNEL_NAME,
    peerName: process.env.PEER_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    walletPath: process.env.WALLET_PATH,
    mspId: process.env.MSPID
  });

  process.on('SIGINT', () => {
    shutdown({ logger, name: 'admin-service' });
  });

  process.on('SIGTERM', () => {
    shutdown({ logger, name: 'admin-service' });
  });

  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Admin service started at ${url}graphql`);
    logger.info(`🚀 Admin service started at ${url}graphql`);
  });
})().catch(error => {
  console.error(error);
  process.exit();
});
