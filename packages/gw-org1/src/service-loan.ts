require('./env');
import { createService } from '@espresso/gw-node';
import {
  Loan,
  LoanEvents,
  loanReducer,
  loanResolvers,
  loanTypeDefs
} from '@espresso/model-loan';

createService({
  enrollmentId: 'admin',
  defaultEntityName: 'loan',
  defaultReducer: loanReducer
}).then(async ({ config, getRepository }) => {
  const app = await config({
    typeDefs: loanTypeDefs,
    resolvers: loanResolvers
  }).addRepository(getRepository<Loan, LoanEvents>({
    entityName: 'loan',
    reducer: loanReducer
  })).create();

  app
    .listen({ port: 14012 })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'loan' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
