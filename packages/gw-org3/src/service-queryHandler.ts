require('./env');
import util from 'util';
import { counterReducer, getReducer } from '@fabric-es/fabric-cqrs';
import { createQueryHandlerService, getLogger } from '@fabric-es/gateway-lib';
import { User, UserEvents, userIndexDefinition, userReducer } from '@fabric-es/model-common';
import { DocContents, DocContentsEvents, docContentsReducer } from '@fabric-es/model-document';
import {
  Loan,
  LoanEvents,
  loanIndexDefinition,
  LoanInRedis,
  loanReducer,
  OutputLoan,
  postSelector as loanPostSelector,
  preSelector as loanPreSelector,
} from '@fabric-es/model-loan';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';
import { LoanDetails, LoanDetailsEvents, loanDetailsReducer } from './model/private/loan-details';
import {
  Document,
  DocumentEvents,
  documentIndexDefinition,
  documentReducer,
  preSelector as docPreSelector,
  postSelector as docPostSelector,
  DocumentInRedis,
  OutputDocument,
} from './model/public/document';

const port = parseInt(process.env.QUERY_PORT, 10) || 5000;
const logger = getLogger('[query-handler] app.js');
const authCheck = process.env.AUTHORIZATION_SERVER_URI;

void (async () => {
  const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
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
    loanDetails: getReducer<LoanDetails, LoanDetailsEvents>(loanDetailsReducer),
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
  console.error(error);
  logger.error(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
