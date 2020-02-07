require('./env');
import { createService } from '@espresso/gw-node';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  docContentsResolvers,
  docContentsTypeDefs
} from '@espresso/model-loan-private';

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'docContents',
  defaultReducer: docContentsReducer,
  collection: process.env.COLLECTION,
  isPrivate: true
}).then(async ({ config, getPrivateDataRepo }) => {
  const app = await config({
    typeDefs: docContentsTypeDefs,
    resolvers: docContentsResolvers
  }).addRepository(getPrivateDataRepo<DocContents, DocContentsEvents>({
    entityName: 'docContents',
    reducer: docContentsReducer
  })).create();

  app
    .listen({ port: 14014 })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'docContents' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
