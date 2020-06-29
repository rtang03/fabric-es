require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
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

(async () => {
  const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };

  const reducers = {
    document: getReducer<Document, DocumentEvents>(documentReducer),
    loan: getReducer<Loan, LoanEvents>(loanReducer),
    docContents: getReducer<DocContents, DocContentsEvents>(docContentsReducer),
    user: getReducer<User, UserEvents>(userReducer),
  };

  const { server } = await createQueryHandlerService(['document', 'loan', 'docContents', 'user'], {
    redisOptions,
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    enrollmentId: process.env.ORG_ADMIN_ID,
    reducers,
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

  process.on('SIGINT', async () => shutdown());

  process.on('SIGTERM', async () => shutdown());

  process.on('uncaughtException', (err) => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  await server.listen({ port }).then(({ url, subscriptionsUrl }) => {
    logger.info(`🚀 queryHandler available at ${url}graphql`);
    logger.info(`🚀 Subscription ${subscriptionsUrl}`);

    if (process.env.NODE_ENV === 'production') process.send('ready');
  });
})().catch((error) => {
  console.error(error);
  logger.info(util.format('fail to start queryHandler.js, %j', error));
  process.exit(1);
});
