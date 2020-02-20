require('./env');
import { createService, getLogger } from '@espresso/gw-node';
import {
  Loan,
  LoanEvents,
  loanReducer,
  loanResolvers,
  loanTypeDefs
} from '@espresso/model-loan';
import { FileSystemWallet } from 'fabric-network';
import util from 'util';

const logger = getLogger('service-loan.js');

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'loan',
  defaultReducer: loanReducer,
  collection: process.env.COLLECTION,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET)
})
  .then(async ({ config, shutdown, getRepository }) => {
    const app = await config({
      typeDefs: loanTypeDefs,
      resolvers: loanResolvers
    }).addRepository(
        getRepository<Loan, LoanEvents>({
          entityName: 'loan',
          reducer: loanReducer
        })
      ).create();

    process.on('SIGINT', async () => await shutdown(app));
    process.on('SIGTERM', async () => await shutdown(app));
    process.on('uncaughtException', err => {
      logger.error('An uncaught error occurred!');
      logger.error(err.stack);
    });

    app.listen({ port: process.env.SERVICE_LOAN_PORT }).then(({ url }) => {
      logger.info(`🚀  '${process.env.ORGNAME}' - 'loan' available at ${url}`);
      process.send('ready');
    });
  })
  .catch(error => {
    console.error(error);
    logger.error(util.format('fail to start service, %j', error));
    process.exit(1);
  });
