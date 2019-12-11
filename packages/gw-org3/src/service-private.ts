import {
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer
} from '@espresso/model-loan-private';
import {
  resolvers,
  typeDefs
} from './model/private';
import { startService } from './start-service';

startService({
  enrollmentId: 'admin',
  defaultEntityName: 'private',
  defaultReducer: loanDetailsReducer,
  isPrivate: true
}).then(({ config, getPrivateDataRepo }) => {
  config({
    port: 14034,
    typeDefs,
    resolvers
  }).addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
    entityName: 'loanDetails',
    reducer: loanDetailsReducer
  })).run();
});
