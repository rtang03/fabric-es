require('./env');
import util from 'util';
import { buildRedisOptions, createQueryHandlerService, getLogger } from '@fabric-es/gateway-lib';
import {
  Loan,
  loanIndices,
  loanReducer,
  loanPostSelector,
  loanPreSelector,
} from '@fabric-es/model-loan';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';
import {
  Document,
  documentIndices,
  documentReducer,
  documentPostSelector,
  documentPreSelector,
} from './model/public/document';

const port = parseInt(process.env.QUERY_PORT, 10) || 5000;
const logger = getLogger('[query-handler] app.js');
const authCheck = process.env.AUTHORIZATION_SERVER_URI;

void (async () => {
  const redisOptions: RedisOptions = buildRedisOptions(
    process.env.REDIS_HOST,
    (process.env.REDIS_PORT || 6379) as number,
    logger
  );

  const { getServer, shutdown } = await createQueryHandlerService({
    redisOptions,
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    enrollmentId: process.env.ORG_ADMIN_ID,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    authCheck,
  })
    .addRedisRepository(Document, {
      reducer: documentReducer,
      fields: documentIndices,
      preSelector: documentPreSelector,
      postSelector: documentPostSelector,
    })
    .addRedisRepository(Loan, {
      reducer: loanReducer,
      fields: loanIndices,
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
    logger.info(`🚀 queryHandler available at port: ${url}graphql`);

    logger.info(`🚀 Subscription available at port: ${subscriptionsUrl}`);

    process.send?.('ready');
  });
})().catch((error) => {
  logger.error(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
