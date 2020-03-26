require('./env');
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { createService, getLogger } from '@fabric-es/gateway-lib';
import { FileSystemWallet } from 'fabric-network';
import {
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
  loanDetailsResolvers,
  loanDetailsTypeDefs
} from './model/private/loan-details';

const logger = getLogger('service-prv-ctnt.js');
const reducer = getReducer<LoanDetails, LoanDetailsEvents>(loanDetailsReducer);

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'loanDetails',
  defaultReducer: reducer,
  collection: process.env.COLLECTION,
  isPrivate: true,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET)
})
  .then(async ({ config, shutdown, getPrivateDataRepo }) => {
    const app = await config({
      typeDefs: loanDetailsTypeDefs,
      resolvers: loanDetailsResolvers
    })
      .addRepository(
        getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
          entityName: 'loanDetails',
          reducer
        })
      )
      .create();

    process.on('SIGINT', async () => await shutdown(app));
    process.on('SIGTERM', async () => await shutdown(app));
    process.on('uncaughtException', err => {
      logger.error('An uncaught error occurred!');
      logger.error(err.stack);
    });

    app.listen({ port: process.env.PRIVATE_LOAN_DETAILS_PORT }).then(({ url }) => {
      logger.info(`🚀  '${process.env.ORGNAME}' - 'pLoanDetails' ready at ${url}`);
      if (process.env.NODE_ENV === 'production') process.send('ready');
    });
  })
  .catch(error => {
    console.error(error);
    logger.error(util.format('fail to start service, %j', error));
    process.exit(1);
  });
