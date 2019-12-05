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
    port: 14012,
    typeDefs: loanTypeDefs,
    resolvers: loanResolvers
  }).addRepository(getRepository<Loan, LoanEvents>({
    entityName: 'loan',
    reducer: loanReducer
  })).run();
});
