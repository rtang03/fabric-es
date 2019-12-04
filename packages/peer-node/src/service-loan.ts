import {
  Loan,
  LoanEvents,
  loanReducer,
  loanResolvers,
  loanTypeDefs
} from '@espresso/model-loan';
import { startService } from './start-service';

startService({
  enrollmentId: 'admin',
  defaultEntityName: 'loan',
  defaultReducer: loanReducer
}).then(({ config, getRepository }) => {
  config({
    port: 14002,
    typeDefs: loanTypeDefs,
    resolvers: loanResolvers
  }).addRepository('loan', getRepository<Loan, LoanEvents>({
    entityName: 'loan',
    reducer: loanReducer
  })).run();
});
