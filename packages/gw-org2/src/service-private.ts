import {
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
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
    port: 14024,
    typeDefs,
    resolvers
  }).addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
    entityName: 'loanDetails',
    reducer: loanDetailsReducer
  })).run();
});
