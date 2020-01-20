require('./env');
import { createService } from '@espresso/gw-node';
import {
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer
} from '@espresso/model-loan-private';
import { resolvers, typeDefs } from './model/private';

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'private',
  defaultReducer: loanDetailsReducer,
  collection: process.env.COLLECTION,
  isPrivate: true
}).then(async ({ config, getPrivateDataRepo }) => {
  const app = await config({
    typeDefs,
    resolvers
  }).addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
    entityName: 'loanDetails',
    reducer: loanDetailsReducer
  })).create();

  app
    .listen({ port: process.env.SERVICE_PRIVATE_PORT })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'private data' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
