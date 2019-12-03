import {
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs
} from '@espresso/common';
import { bootstrap, prepare } from './start-service';

prepare({
  enrollmentId: 'admin',
  defaultEntityName: 'document',
  defaultReducer: documentReducer
}).then(({ getRepository, getPrivateDataRepo, reconcile, subscribeHub, ...rest }) => {
  bootstrap({
    port: 14003,
    typeDefs: documentTypeDefs,
    resolvers: documentResolvers,
    repositories: [
      {
        entityName: 'document',
        repository: getRepository<Document, DocumentEvents>({
          entityName: 'document',
          reducer: documentReducer
        })
      }
    ],
    reconcile,
    subscribeHub,
    ...rest
  });
});