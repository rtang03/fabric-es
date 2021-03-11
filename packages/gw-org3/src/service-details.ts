require('./env');
import util from 'util';
import { buildFederatedSchema } from '@apollo/federation';
import { buildRedisOptions, createService, getLogger, ServiceType } from '@fabric-es/gateway-lib';
import {
  Loan,
  loanIndices,
  loanPostSelector,
  loanPreSelector,
  loanReducer,
} from '@fabric-es/model-loan';
import { Wallets } from 'fabric-network';
import {
  LoanDetails,
  loanDetailsReducer,
  loanDetailsResolvers,
  loanDetailsTypeDefs,
} from './model/private/loan-details';

const serviceName = 'loanDetails';
const logger = getLogger('service-prv-dtls.js');

void (async () =>
  createService({
    enrollmentId: process.env.ORG_ADMIN_ID,
    serviceName: 'loanDetails',
    type: ServiceType.Private,
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
    .then(({ config, shutdown, getPrivateRepository }) => {
      const app = config(buildFederatedSchema([{
        typeDefs: loanDetailsTypeDefs,
        resolvers: loanDetailsResolvers,
      }]))
      .addRepository(Loan, {
        reducer: loanReducer,
        fields: loanIndices,
        postSelector: loanPostSelector,
        preSelector: loanPreSelector,
      })
      .addPrivateRepository(LoanDetails, loanDetailsReducer)
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

      void app.listen({ port: process.env.PRIVATE_LOAN_DETAILS_PORT }).then(({ url }) => {
        logger.info(`🚀  '${process.env.MSPID}' - '${serviceName}' available at ${url}`);
        process.send?.('ready');
      });
    })
    .catch((error) => {
      console.error(error);
      logger.error(util.format('fail to start service, %j', error));
      process.exit(1);
    }))();
