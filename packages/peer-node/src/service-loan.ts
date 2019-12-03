import {
  Loan,
  LoanEvents,
  loanReducer,
  loanResolvers,
  loanTypeDefs
} from '@espresso/common';
import { bootstrap, prepare } from './start-service';

prepare({
  enrollmentId: 'admin',
  defaultEntityName: 'loan',
  defaultReducer: loanReducer
}).then(({ getRepository, getPrivateDataRepo, reconcile, subscribeHub, ...rest }) => {
  bootstrap({
    port: 14002,
    typeDefs: loanTypeDefs,
    resolvers: loanResolvers,
    repositories: [
      {
        entityName: 'loan',
        repository: getRepository<Loan, LoanEvents>({
          entityName: 'loan',
          reducer: loanReducer
        })
      }
    ],
    reconcile,
    subscribeHub,
    ...rest
  });
});