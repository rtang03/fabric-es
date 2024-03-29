require('dotenv').config({ path: './.env.test' });
import util from 'util';
import {
  Counter,
  counterIndexDefinition,
  CounterInRedis,
  counterReducerCallback,
  OutputCounter,
  counterPreSelector,
  counterPostSelector,
  CounterEvents,
} from '@fabric-es/fabric-cqrs';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';
import { getLogger } from '../utils';
import { createQueryHandlerService } from './createQueryHandlerService';

const port = parseInt(process.env.QUERY_PORT, 10) || 5001;
const logger = getLogger('[query-handler] app.js');
const authCheck = process.env.AUTHORIZATION_SERVER_URI;

/**
 * Notice that this file "app.ts" is used for local development only. Not for deployment use.
 */

(async () => {
  const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };

  Counter.entityName = 'counter';
  const { getServer, shutdown } = await createQueryHandlerService({
    redisOptions,
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    enrollmentId: process.env.ORG_ADMIN_ID,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    authCheck,
  })
    .addRedisRepository<Counter, CounterInRedis, OutputCounter, CounterEvents>(
      Counter, {
        reducer: counterReducerCallback,
        fields: counterIndexDefinition,
        preSelector: counterPreSelector,
        postSelector: counterPostSelector,
    })
    .run();

  const server = getServer();

  process.on(
    'SIGINT',
    async () =>
      await shutdown()
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
  );

  process.on(
    'SIGTERM',
    async () =>
      await shutdown()
        .then(() => process.exit(0))
        .catch(() => process.exit(1))
  );

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
  logger.error(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
