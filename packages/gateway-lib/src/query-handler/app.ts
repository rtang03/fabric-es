require('dotenv').config({ path: './.env.test' });
import util from 'util';
import { counterReducer } from '@fabric-es/fabric-cqrs';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';
import { getLogger } from '../utils';
import { createQueryHandlerService } from './createQueryHandlerService';

const port = parseInt(process.env.QUERY_PORT, 10) || 5001;
const logger = getLogger('[query-handler] app.js');

(async () => {
  const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };

  const { server } = await createQueryHandlerService(['counter'], {
    redisOptions,
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    enrollmentId: process.env.ORG_ADMIN_ID,
    reducers: { counter: counterReducer },
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
  });

  const shutdown = async () => {
    await server.stop().catch((err) => {
      if (err) {
        logger.error(util.format('An error occurred while closing the server: %j', err));
        process.exitCode = 1;
      } else logger.info('server closes');
    });
    process.exit();
  };

  process.on('SIGINT', () => shutdown());

  process.on('SIGTERM', () => shutdown());

  process.on('uncaughtException', (err) => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  await server.listen({ port }).then(({ url, subscriptionsUrl }) => {
    console.info(`🚀 QueryHandler started at port: ${url}graphql`);
    logger.info(`🚀 QueryHandler started at port: ${url}graphql`);

    console.info(`🚀 Subscription ready at port: ${subscriptionsUrl}`);
    logger.info(`🚀 Subscription ready at port: ${subscriptionsUrl}`);

    // const entityNames = process.env.RECONCILE.split(',');
  });
})().catch((error) => {
  console.error(error);
  logger.info(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
