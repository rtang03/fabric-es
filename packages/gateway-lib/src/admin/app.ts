import { getLogger } from '..';
import { createAdminService } from '.';

const port = (process.env.PORT || 8080) as number;

(async () => {
  const logger = getLogger('[gw-lib] app.js');
  logger.info('starting admin-service...');

  const { server, shutdown } = await createAdminService({
    caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
    caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
    ordererName: process.env.ORDERER_NAME,
    ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
    channelName: process.env.CHANNEL_NAME,
    peerName: process.env.PEER_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    walletPath: process.env.WALLET_PATH,
    orgName: process.env.ORGNAME,
    orgUrl: process.env.ORGURL,
  });

  process.on('SIGINT', async () => await shutdown(server)
    .then(() => process.exit(0))
    .catch(() => process.exit(1)));

  process.on('SIGTERM', async () => await shutdown(server)
    .then(() => process.exit(0))
    .catch(() => process.exit(1)));

  process.on('uncaughtException', (err) => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Admin service started at ${url}graphql`);
    logger.info(`🚀 Admin service started at ${url}graphql`);
  });
})().catch((error) => {
  console.error(error);
  process.exit();
});
