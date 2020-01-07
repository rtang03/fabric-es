require('./env');
import { createService } from '@espresso/gw-node';
import {
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs
} from '@espresso/model-loan';

console.log('HO', process.env.ENROLLMENT_ID_ADMIN);
createService({
  enrollmentId: process.env.ENROLLMENT_ID_ADMIN,
  defaultEntityName: 'document',
  defaultReducer: documentReducer,
  collection: process.env.COLLECTION
}).then(async ({ config, getRepository }) => {
  const app = await config({
    typeDefs: documentTypeDefs,
    resolvers: documentResolvers
  }).addRepository(getRepository<Document, DocumentEvents>({
    entityName: 'document',
    reducer: documentReducer
  })).create();

  app
    .listen({ port: process.env.SERVICE_DOCUMENT_PORT })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'document' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
