import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
  resolvers,
  typeDefs
} from '@espresso/model-loan';
import { startService } from './start-service';

startService({
  enrollmentId: 'admin',
  defaultEntityName: 'private',
  defaultReducer: loanDetailsReducer,
  isPrivate: true
}).then(({ config, getPrivateDataRepo }) => {
  config({
    port: 14004,
    typeDefs,
    resolvers
  }).addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
    entityName: 'loanDetails',
    reducer: loanDetailsReducer
  })).addRepository(getPrivateDataRepo<DocContents, DocContentsEvents>({
    entityName: 'docContents',
    reducer: docContentsReducer
  })).run();
});
