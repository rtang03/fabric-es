require('./env');
import util from 'util';
import { createQueryHandlerService, getLogger } from '@fabric-es/gateway-lib';
import {
  Document,
  DocumentEvents,
  DocumentOutput,
  DocumentInRedis,
  documentReducer,
  documentPostSelector,
  documentPreSelector,
  documentIndices,
} from '@fabric-es/model-document';
import {
  loanReducer,
  loanIndices,
  loanPostSelector,
  loanPreSelector,
  Loan, LoanEvents, LoanInRedis, LoanOutput
} from '@fabric-es/model-loan';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';

const port = parseInt(process.env.QUERY_PORT, 10) || 5000;
const logger = getLogger('[query-handler] app.js');
const authCheck = process.env.AUTHORIZATION_SERVER_URI;

void (async () => {
  const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    retryStrategy: (times) => {
      if (times > 3) {
        // the 4th return will exceed 10 seconds, based on the return value...
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
    },
  };

  const { getServer, shutdown } = await createQueryHandlerService({
    redisOptions,
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    enrollmentId: process.env.ORG_ADMIN_ID,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    authCheck,
  })
    .addRedisRepository<Document, DocumentInRedis, DocumentOutput, DocumentEvents>(
      Document, {
        fields: documentIndices,
        reducer: documentReducer,
        preSelector: documentPreSelector,
        postSelector: documentPostSelector,
      })
    .addRedisRepository<Loan, LoanInRedis, LoanOutput, LoanEvents>(
      Loan, {
        fields: loanIndices,
        reducer: loanReducer,
        postSelector: loanPostSelector,
        preSelector: loanPreSelector,
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

  void server.listen({ port }).then(({ url, subscriptionsUrl }) => {
    logger.info(`🚀 queryHandler available at ${url}graphql`);
    logger.info(`🚀 Subscription ${subscriptionsUrl}`);

    process?.send?.('ready');
  });
})().catch((error) => {
  console.error(error);
  logger.error(util.format('fail to start queryHandler.js, %j', error));
  process.exit(1);
});
