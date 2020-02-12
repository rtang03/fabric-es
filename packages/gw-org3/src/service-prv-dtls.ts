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
}).then(async ({ config, getPrivateDataRepo }) => {
  const app = await config({
    typeDefs: loanDetailsTypeDefs,
    resolvers: loanDetailsResolvers
  })
  .addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({ entityName: 'loanDetails', reducer: loanDetailsReducer }))
  .create();

  app
    .listen({ port: process.env.PRIVATE_LOAN_DETAILS_PORT })
    .then(({ url }) => {
      console.log(`🚀  '${process.env.ORGNAME}' - 'loanDetails' available at ${url}`);
      process.send('ready');
    });
}).catch(error => {
  console.error(error);
  process.exit(1);
});
