require('./env');

import { createService } from '@espresso/gw-node';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
  resolvers,
  typeDefs
} from '@espresso/model-loan-private';
import { FileSystemWallet } from 'fabric-network';

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'private',
  defaultReducer: loanDetailsReducer,
  collection: process.env.COLLECTION,
  isPrivate: true,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET),
}).then(async ({ config, getPrivateDataRepo }) => {
  const app = await config({
    typeDefs,
    resolvers
  })
  .addRepository(getPrivateDataRepo<DocContents, DocContentsEvents>({ entityName: 'docContents', reducer: docContentsReducer }))
  .addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({ entityName: 'loanDetails', reducer: loanDetailsReducer }))
  .create();

  app
    .listen({ port: process.env.SERVICE_PRIVATE_PORT })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'private data' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
