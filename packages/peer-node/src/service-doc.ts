import {
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs
} from '@espresso/model-loan';
import { startService } from './start-service';

startService({
  enrollmentId: 'admin',
  defaultEntityName: 'document',
  defaultReducer: documentReducer
}).then(({ config, getRepository }) => {
  config({
    port: 14003,
    typeDefs: documentTypeDefs,
    resolvers: documentResolvers
  }).addRepository('document', getRepository<Document, DocumentEvents>({
    entityName: 'document',
    reducer: documentReducer
  })).run();
});
