require('./env');
import { startService } from '@espresso/gw-node';
import {
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs
} from './model/public/document';

startService({
  enrollmentId: 'admin',
  defaultEntityName: 'document',
  defaultReducer: documentReducer
}).then(({ config, getRepository }) => {
  config({
    port: 14023,
    typeDefs: documentTypeDefs,
    resolvers: documentResolvers
  })
    .addRepository(
      getRepository<Document, DocumentEvents>({
        entityName: 'document',
        reducer: documentReducer
      })
    )
    .run();
});
