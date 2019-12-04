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
  }).addRepository('loanDetails', getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
    entityName: 'loanDetails',
    reducer: loanDetailsReducer
  })).addRepository('docContents', getPrivateDataRepo<DocContents, DocContentsEvents>({
    entityName: 'docContents',
    reducer: docContentsReducer
  })).run();
});
