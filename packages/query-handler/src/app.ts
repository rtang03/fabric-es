require('./env');
import util from 'util';
import Redis from 'ioredis';
import { createQueryDatabase, getLogger } from './utils';
import { createApolloServer } from './utils/createApolloServer';

const port = parseInt(process.env.PORT, 10) || 5000;
const logger = getLogger({ name: '[query-handler] app.js' });

(async () => {
  // Todo: checking the database type; and switch implementation

  const redis = new Redis();

  const queryDatabase = createQueryDatabase(redis);

  const apolloServer = await createApolloServer(queryDatabase);

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

  await apolloServer.listen({ port }).then(({ url }) => {
    console.info(`🚀 QueryHandler started at port: ${url}:${port}`);
    logger.info(`🚀  QueryHandler started at port: ${url}:${port}`);

    const entityNames = process.env.RECONCILE.split(',');
  });
})().catch((error) => {
  console.error(error);
  logger.info(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
