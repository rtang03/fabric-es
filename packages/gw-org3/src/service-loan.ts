require('./env');

import { createService } from '@espresso/gw-node';
import {
  Loan,
  LoanEvents,
  loanReducer,
  loanResolvers,
  loanTypeDefs
} from '@espresso/model-loan';
import { FileSystemWallet } from 'fabric-network';

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'loan',
  defaultReducer: loanReducer,
  collection: process.env.COLLECTION,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET),
}).then(async ({ config, getRepository }) => {
  const app = await config({
    typeDefs: loanTypeDefs,
    resolvers: loanResolvers
  }).addRepository(getRepository<Loan, LoanEvents>({
    entityName: 'loan',
    reducer: loanReducer
  })).create();

  app
    .listen({ port: process.env.SERVICE_LOAN_PORT })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'loan' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
