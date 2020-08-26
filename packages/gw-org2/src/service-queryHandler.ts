require('./env');
import util from 'util';
import { counterReducer, getReducer } from '@fabric-es/fabric-cqrs';
import { createQueryHandlerService, getLogger } from '@fabric-es/gateway-lib';
import { User, UserEvents, userReducer } from '@fabric-es/model-common';
import { Document, DocumentEvents, documentReducer } from '@fabric-es/model-document';
import {
  Loan,
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
  LoanEvents,
  loanReducer,
} from '@fabric-es/model-loan';
import { Wallets } from 'fabric-network';
import { RedisOptions } from 'ioredis';

const port = parseInt(process.env.QUERY_PORT, 10) || 5000;
const logger = getLogger('[query-handler] app.js');
const authCheck = process.env.AUTHORIZATION_SERVER_URI;

(async () => {
  const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };

  const reducers = {
    document: getReducer<Document, DocumentEvents>(documentReducer),
    loan: getReducer<Loan, LoanEvents>(loanReducer),
    user: getReducer<User, UserEvents>(userReducer),
    loanDetails: getReducer<LoanDetails, LoanDetailsEvents>(loanDetailsReducer),
    counter: counterReducer,
  };

  const { server, shutdown } = await createQueryHandlerService(['document', 'loan', 'user', 'loanDetails', 'counter'], {
    redisOptions,
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    enrollmentId: process.env.ORG_ADMIN_ID,
    reducers,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    authCheck,
  });

  process.on('SIGINT', async () => shutdown());

  process.on('SIGTERM', async () => shutdown());

  process.on('uncaughtException', (err) => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  await server.listen({ port }).then(({ url, subscriptionsUrl }) => {
    logger.info(`🚀 queryHandler available at ${url}`);
    logger.info(`🚀 Subscription ${subscriptionsUrl}`);

    process.send?.('ready');
  });
})().catch((error) => {
  console.error(error);
  logger.info(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
