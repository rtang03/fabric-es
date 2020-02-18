require('./env');

import { createService } from '@espresso/gw-node';
import {
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
  loanDetailsResolvers,
  loanDetailsTypeDefs
} from '@espresso/model-loan-private';
import { FileSystemWallet } from 'fabric-network';
import http from 'http';
import stoppable from 'stoppable';
import util from 'util';
import { getLogger } from './logger';
// import { resolvers, typeDefs } from './model/private';

const logger = getLogger('service-prv-dtls.js');

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'loanDetails',
  defaultReducer: loanDetailsReducer,
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
          reducer: loanDetailsReducer
        })
      )
      .create();

    process.on('SIGINT', async () => await shutdown(app));
    process.on('SIGTERM', async () => await shutdown(app));
    process.on('uncaughtException', err => {
      logger.error('An uncaught error occurred!');
      logger.error(err.stack);
    });

    app
      .listen({ port: process.env.PRIVATE_LOAN_DETAILS_PORT })
      .then(({ url }) => {
        logger.info(
          `🚀  '${process.env.ORGNAME}' - 'loanDetails' available at ${url}`
        );
        process.send('ready');
      });
  })
  .catch(error => {
    console.error(error);
    logger.error(util.format('fail to start service, %j', error));
    process.exit(1);
  });
