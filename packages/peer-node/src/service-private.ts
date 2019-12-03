import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
  resolvers,
  typeDefs
} from './private';
import { bootstrap, prepare } from './start-service';

prepare({
  enrollmentId: 'admin',
  defaultEntityName: 'private',
  defaultReducer: loanDetailsReducer
}).then(({ getRepository, getPrivateDataRepo, reconcile, subscribeHub, ...rest }) => {
  bootstrap({
    port: 14004,
    typeDefs,
    resolvers,
    repositories: [
      {
        entityName: 'loanDetails',
        repository: getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
          entityName: 'loanDetails',
          reducer: loanDetailsReducer
        })
      },
      {
        entityName: 'docContents',
        repository: getPrivateDataRepo<DocContents, DocContentsEvents>({
          entityName: 'docContents',
          reducer: docContentsReducer
        })
      }
    ],
    ...rest
  });
});