require('./env');
import util from 'util';
import { buildRedisOptions, createAdminService, getLogger } from '@fabric-es/gateway-lib';

const port = process.env.ADMINISTRATOR_PORT || 15001;
const logger = getLogger('service-admin.js');

void (async () => {
  const { server, shutdown } = await createAdminService({
    caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
    caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    caName: process.env.CA_NAME,
    walletPath: process.env.WALLET,
    keyPath: process.env.ORGKEY,
    orgName: process.env.ORGNAME,
    orgUrl: process.env.ORGURL,
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    redisOptions: buildRedisOptions(
      process.env.REDIS_HOST,
      (process.env.REDIS_PORT || 6379) as number,
      logger
    ),
  });

  process.on(
    'SIGINT',
    async () =>
      await shutdown(server)
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
  );
  process.on(
    'SIGTERM',
    async () =>
      await shutdown(server)
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
  );
  process.on('uncaughtException', (err) => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  void server.listen({ port }).then(({ url }) => {
    logger.info(`🚀 admin service ready at ${url}graphql`);
    process.send?.('ready');
  });
})().catch((error) => {
  console.error(error);
  logger.error(util.format('fail to start service, %j', error));
  process.exit(1);
});
