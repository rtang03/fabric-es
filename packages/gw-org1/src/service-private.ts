require('./env');
import { createService } from '@espresso/gw-node';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer
} from '@espresso/model-loan-private';
import { resolvers, typeDefs } from './model/private';

createService({
  enrollmentId: 'admin',
  defaultEntityName: 'private',
  defaultReducer: docContentsReducer,
  isPrivate: true
}).then(async ({ config, getPrivateDataRepo }) => {
  const app = await config({
    typeDefs,
    resolvers
  }).addRepository(getPrivateDataRepo<DocContents, DocContentsEvents>({
    entityName: 'docContents',
    reducer: docContentsReducer
  })).create();

  app
    .listen({ port: 14014 })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'private data *' available at ${url}`));
}).catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
