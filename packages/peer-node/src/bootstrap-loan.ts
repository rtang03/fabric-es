require('events').EventEmitter.defaultMaxListeners = 15;
import {
  Loan,
  LoanEvents,
  loanReducer,
  loanResolvers,
  loanTypeDefs
} from '@espresso/common';
import './env';
import { bootstrap } from './utils/bootstrap';

bootstrap<Loan, LoanEvents>({
  entityName: 'loan',
  port: 14002,
  enrollmentId: 'admin',
  reducer: loanReducer,
  typeDefs: loanTypeDefs,
  resolvers: loanResolvers
});
