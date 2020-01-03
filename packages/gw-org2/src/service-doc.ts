require('./env');
import { createService } from '@espresso/gw-node';
import {
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs
} from './model/public/document';

createService({
  enrollmentId: 'admin',
  defaultEntityName: 'document',
  defaultReducer: documentReducer
}).then(async ({ config, getRepository }) => {
  const app = await config({
    typeDefs: documentTypeDefs,
    resolvers: documentResolvers
  }).addRepository(getRepository<Document, DocumentEvents>({
    entityName: 'document',
    reducer: documentReducer
  })).create();

  app
    .listen({ port: 14023 })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'document' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
