require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { createQueryHandlerService, getLogger } from '@fabric-es/gateway-lib';
import { User, UserEvents, userReducer } from '@fabric-es/model-common';
import { Invoice, InvoiceEvents, invoiceReducer, PO, PoEvents, poReducer } from '@fabric-es/model-pboc';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';

const port = parseInt(process.env.QUERY_PORT, 10) || 5000;
const logger = getLogger('[rl-org3] query.js');
const authCheck = process.env.AUTHORIZATION_SERVER_URI;

(async () => {
  const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    retryStrategy: (times) => {
      if (times > 3) { // the 4th return will exceed 10 seconds, based on the return value...
        logger.error(`Redis: connection retried ${times} times, exceeded 10 seconds.`);
        process.exit(-1);
      }
      return Math.min(times * 100, 3000); // reconnect after (ms)
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return 1;
      }
    }
  };

  const reducers = {
    po: getReducer<PO, PoEvents>(poReducer),
    invoice: getReducer<Invoice, InvoiceEvents>(invoiceReducer),
    user: getReducer<User, UserEvents>(userReducer)
  };

  const { server, shutdown } = await createQueryHandlerService(
    ['po', 'invoice', 'user'],
    {
      redisOptions,
      asLocalhost: !(process.env.NODE_ENV === 'production'),
      channelName: process.env.CHANNEL_NAME,
      connectionProfile: process.env.CONNECTION_PROFILE,
      enrollmentId: process.env.ORG_ADMIN_ID,
      reducers,
      wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
      authCheck,
    }
  );

  process.on('SIGINT', async () => await shutdown()
    .then(() => process.exit(0))
    .catch(() => process.exit(1)));

  process.on('SIGTERM', async () => await shutdown()
    .then(() => process.exit(0))
    .catch(() => process.exit(1)));

  process.on('uncaughtException', (err) => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  await server.listen({ port }).then(({ url, subscriptionsUrl }) => {
    logger.info(`🚀 query available at ${url}graphql`);
    logger.info(`🚀 Subscription ${subscriptionsUrl}`);

    process?.send?.('ready');
  });
})().catch((error) => {
  console.error(error);
  logger.info(util.format('fail to start query.js, %j', error));
  process.exit(1);
});
