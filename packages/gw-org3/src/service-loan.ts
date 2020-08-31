require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { createService, getLogger } from '@fabric-es/gateway-lib';
import { Loan, LoanEvents, loanReducer, loanResolvers, loanTypeDefs } from '@fabric-es/model-loan';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';

const logger = getLogger('service-loan.js');
const reducer = getReducer<Loan, LoanEvents>(loanReducer);

(async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    serviceName: 'loan',
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    redisOptions: {
      host: process.env.REDIS_HOST,
      port: (process.env.REDIS_PORT || 6379) as number,
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
    }
  })
    .then(async ({ config, shutdown, getRepository }) => {
      const app = await config({
        typeDefs: loanTypeDefs,
        resolvers: loanResolvers,
      })
        .addRepository(getRepository<Loan, LoanEvents>('loan', reducer))
        .create();

      process.on('SIGINT', async () => await shutdown(app)
        .then(() => process.exit(0))
        .catch(() => process.exit(1)));

      process.on('SIGTERM', async () => await shutdown(app)
        .then(() => process.exit(0))
        .catch(() => process.exit(1)));

      process.on('uncaughtException', (err) => {
        logger.error('An uncaught error occurred!');
        logger.error(err.stack);
      });

      app.listen({ port: process.env.SERVICE_LOAN_PORT }).then(({ url }) => {
        logger.info(`🚀  '${process.env.MSPID}' - 'loan' available at ${url}`);
        process.send?.('ready');
      });
    })
    .catch((error) => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(1);
    }))();
