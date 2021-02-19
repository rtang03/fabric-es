require('./env');
import util from 'util';
import {
  counterReducer,
  getReducer,
  counterPreSelector,
  counterPostSelector,
  counterIndexDefinition,
} from '@fabric-es/fabric-cqrs';
import type { Counter, CounterInRedis, OutputCounter } from '@fabric-es/fabric-cqrs';
import { createQueryHandlerService, getLogger } from '@fabric-es/gateway-lib';
import { userReducer, userIndexDefinition } from '@fabric-es/model-common';
import type { User, UserEvents } from '@fabric-es/model-common';
import {
  docContentsReducer,
  documentReducer,
  postSelector as docPostSelector,
  preSelector as docPreSelector,
  documentIndexDefinition,
} from '@fabric-es/model-document';
import type {
  DocContents,
  DocContentsEvents,
  Document,
  DocumentEvents,
  OutputDocument,
  DocumentInRedis,
} from '@fabric-es/model-document';
import {
  loanReducer,
  loanIndexDefinition,
  postSelector as loanPostSelector,
  preSelector as loanPreSelector,
} from '@fabric-es/model-loan';
import type { Loan, LoanEvents, LoanInRedis, OutputLoan } from '@fabric-es/model-loan';
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

  const reducers = {
    document: getReducer<Document, DocumentEvents>(documentReducer),
    loan: getReducer<Loan, LoanEvents>(loanReducer),
    docContents: getReducer<DocContents, DocContentsEvents>(docContentsReducer),
    user: getReducer<User, UserEvents>(userReducer),
    counter: counterReducer,
  };

  const { getServer, shutdown } = await createQueryHandlerService({
    redisOptions,
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    enrollmentId: process.env.ORG_ADMIN_ID,
    reducers,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    authCheck,
  })
    .addRedisRepository({ entityName: 'user', fields: userIndexDefinition })
    .addRedisRepository<Document, DocumentInRedis, OutputDocument>({
      entityName: 'document',
      fields: documentIndexDefinition,
      preSelector: docPreSelector,
      postSelector: docPostSelector,
    })
    .addRedisRepository<Loan, LoanInRedis, OutputLoan>({
      entityName: 'loan',
      fields: loanIndexDefinition,
      postSelector: loanPostSelector,
      preSelector: loanPreSelector,
    })
    .addRedisRepository<Counter, CounterInRedis, OutputCounter>({
      entityName: 'counter',
      fields: counterIndexDefinition,
      postSelector: counterPostSelector,
      preSelector: counterPreSelector,
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
