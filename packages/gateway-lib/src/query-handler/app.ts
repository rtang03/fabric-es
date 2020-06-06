import util from 'util';
import Redis from 'ioredis';
import { getLogger } from '../utils';
import { createQueryHandlerService } from './createQueryHandlerService';

const port = parseInt(process.env.PORT, 10) || 5000;
const logger = getLogger('[query-handler] app.js');

(async () => {
  const options = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };

  const redis = new Redis(options);

  // const queryDatabase = createQueryDatabase(redis);

  const apolloServer = await createQueryHandlerService({ publisher: redis, subscriber: redis });

  const shutdown = async () => {
    await apolloServer.stop().catch((err) => {
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

  await apolloServer.listen({ port }).then(({ url, subscriptionsUrl }) => {
    console.info(`🚀 QueryHandler started at port: ${url}:${port}`);
    logger.info(`🚀 QueryHandler started at port: ${url}:${port}`);

    console.info(`🚀 Subscription ready at port: ${subscriptionsUrl}`);
    logger.info(`🚀 Subscription ready at port: ${subscriptionsUrl}`);

    // const entityNames = process.env.RECONCILE.split(',');
  });
})().catch((error) => {
  console.error(error);
  logger.info(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
