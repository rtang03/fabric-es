require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { createQueryHandlerService, getLogger } from '@fabric-es/gateway-lib';
import { User, UserEvents, userReducer } from '@fabric-es/model-common';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';
import { Invoice, InvoiceEvents, invoiceReducer, PO, PoEvents, poReducer } from './pbocEtc';

const port = parseInt(process.env.QUERY_PORT, 10) || 5000;
const logger = getLogger('[rl-org3] query.js');
const authCheck = process.env.AUTHORIZATION_SERVER_URI;

(async () => {
  const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
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

  process.on('SIGINT', async () => shutdown());

  process.on('SIGTERM', async () => shutdown());

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
