require('./env');
import util from 'util';
import { buildRedisOptions, createService, getLogger } from '@fabric-es/gateway-lib';
import {
  Loan,
  loanReducer,
  loanResolvers,
  loanTypeDefs,
  loanIndices,
  loanPostSelector,
  loanPreSelector,
} from '@fabric-es/model-loan';
import { Wallets } from 'fabric-network';

const serviceName = 'loan';
const logger = getLogger('service-loan.js');

void (async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    serviceName,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    redisOptions: buildRedisOptions(
      process.env.REDIS_HOST,
      (process.env.REDIS_PORT || 6379) as number,
      logger
    ),
  })
    .then(({ config, shutdown }) => {
      const app = config([{
        typeDefs: loanTypeDefs,
        resolvers: loanResolvers,
      }])
        .addRepository(Loan, {
          reducer: loanReducer,
          fields: loanIndices,
          postSelector: loanPostSelector,
          preSelector: loanPreSelector,
        })
        .create();

      process.on(
        'SIGINT',
        async () =>
          await shutdown(app)
            .then(() => process.exit(0))
            .catch(() => process.exit(1))
      );

      process.on(
        'SIGTERM',
        async () =>
          await shutdown(app)
            .then(() => process.exit(0))
            .catch(() => process.exit(1))
      );

      process.on('uncaughtException', (err) => {
        logger.error('An uncaught error occurred!');
        logger.error(err.stack);
      });

      void app.listen({ port: process.env.SERVICE_LOAN_PORT }).then(({ url }) => {
        logger.info(`🚀  '${process.env.MSPID}' - '${serviceName}' available at ${url}`);
        process.send?.('ready');
      });
    })
    .catch((error) => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(1);
    }))();
