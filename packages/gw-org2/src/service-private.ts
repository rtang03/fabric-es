require('./env');
import { createService } from '@espresso/gw-node';
import {
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer
} from '@espresso/model-loan-private';
import { resolvers, typeDefs } from './model/private';

createService({
  enrollmentId: process.env.ENROLLMENT_ID_ADMIN,
  defaultEntityName: 'private',
  defaultReducer: loanDetailsReducer,
  collection: process.env.COLLECTION,
  isPrivate: true
}).then(async ({ config, getPrivateDataRepo }) => {
  const app = await config({
    typeDefs,
    resolvers
  }).addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
    entityName: 'docContents',
    reducer: loanDetailsReducer
  })).create();

  app
    .listen({ port: 14024 })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'private data' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
