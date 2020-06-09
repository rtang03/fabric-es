require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { createQueryHandlerService, getLogger } from '@fabric-es/gateway-lib';
import { User, UserEvents, userReducer } from '@fabric-es/model-common';
import { DocContents, DocContentsEvents, docContentsReducer } from '@fabric-es/model-document';
import { Loan, LoanEvents, loanReducer } from '@fabric-es/model-loan';
import { Wallets } from 'fabric-network';
import { RedisOptions } from 'ioredis';
import { LoanDetails, LoanDetailsEvents, loanDetailsReducer } from './model/private/loan-details';
import { Document, DocumentEvents, documentReducer } from './model/public/document';

const port = parseInt(process.env.PORT, 10) || 5000;
const logger = getLogger('[query-handler] app.js');

(async () => {
  const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };

  const reducers = {
    document: getReducer<Document, DocumentEvents>(documentReducer),
    loan: getReducer<Loan, LoanEvents>(loanReducer),
    docContents: getReducer<DocContents, DocContentsEvents>(docContentsReducer),
    loanDetails: getReducer<LoanDetails, LoanDetailsEvents>(loanDetailsReducer),
    user: getReducer<User, UserEvents>(userReducer),
  };

  const { server } = await createQueryHandlerService(
    ['document', 'loan', 'docContents', 'loanDetails', 'user'],
    {
      redisOptions,
      asLocalhost: !(process.env.NODE_ENV === 'production'),
      channelName: process.env.CHANNEL_NAME,
      connectionProfile: process.env.CONNECTION_PROFILE,
      enrollmentId: process.env.ORG_ADMIN_ID,
      reducers,
      wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    }
  );

  const shutdown = async () => {
    await server.stop().catch((err) => {
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

  await server.listen({ port }).then(({ url, subscriptionsUrl }) => {
    console.info(`🚀 QueryHandler started at port: ${url}graphql`);
    logger.info(`🚀 QueryHandler started at port: ${url}graphql`);

    console.info(`🚀 Subscription ready at port: ${subscriptionsUrl}`);
    logger.info(`🚀 Subscription ready at port: ${subscriptionsUrl}`);

    // const entityNames = process.env.RECONCILE.split(',');
  });
})().catch((error) => {
  console.error(error);
  logger.info(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
