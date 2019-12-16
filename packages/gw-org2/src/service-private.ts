require('./env');
import { startService } from '@espresso/gw-node';
import {
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer
} from '@espresso/model-loan-private';
import { resolvers, typeDefs } from './model/private';

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
  })
    .addRepository(
      getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
        entityName: 'loanDetails',
        reducer: loanDetailsReducer
      })
    )
    .run();
});
