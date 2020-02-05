require('./env');
import { createService } from '@espresso/gw-node';
import {
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
  loanDetailsResolvers,
  loanDetailsTypeDefs
} from '@espresso/model-loan-private';

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'loanDetails',
  defaultReducer: loanDetailsReducer,
  collection: process.env.COLLECTION,
  isPrivate: true
}).then(async ({ config, getPrivateDataRepo }) => {
  const app = await config({
    typeDefs: loanDetailsTypeDefs,
    resolvers: loanDetailsResolvers
  })
  .addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({ entityName: 'loanDetails', reducer: loanDetailsReducer }))
  .create();

  app
    .listen({ port: 14034 })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'loanDetails' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
