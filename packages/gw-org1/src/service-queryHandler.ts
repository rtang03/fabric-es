require('./env');
import util from 'util';
import { counterReducer, getReducer } from '@fabric-es/fabric-cqrs';
import { createQueryHandlerService, getLogger } from '@fabric-es/gateway-lib';
import { User, UserEvents, userReducer } from '@fabric-es/model-common';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  Document,
  DocumentEvents,
  documentReducer,
} from '@fabric-es/model-document';
import { Loan, LoanEvents, loanReducer } from '@fabric-es/model-loan';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';

const port = parseInt(process.env.QUERY_PORT, 10) || 5000;
const logger = getLogger('[query-handler] app.js');
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
    document: getReducer<Document, DocumentEvents>(documentReducer),
    loan: getReducer<Loan, LoanEvents>(loanReducer),
    docContents: getReducer<DocContents, DocContentsEvents>(docContentsReducer),
    user: getReducer<User, UserEvents>(userReducer),
    counter: counterReducer,
  };

  const { server, shutdown } = await createQueryHandlerService(
    ['document', 'loan', 'docContents', 'user', 'counter'],
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

  process.on('SIGINT', async () => process.exit(await shutdown()));

  process.on('SIGTERM', async () => process.exit(await shutdown()));

  process.on('uncaughtException', (err) => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  await server.listen({ port }).then(({ url, subscriptionsUrl }) => {
    logger.info(`🚀 queryHandler available at ${url}graphql`);
    logger.info(`🚀 Subscription ${subscriptionsUrl}`);

    process?.send?.('ready');
  });
})().catch((error) => {
  console.error(error);
  logger.info(util.format('fail to start queryHandler.js, %j', error));
  process.exit(1);
});
