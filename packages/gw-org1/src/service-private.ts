require('./env');
import { startService } from '@espresso/gw-node';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer
} from '@espresso/model-loan-private';
import { resolvers, typeDefs } from './model/private';

startService({
  enrollmentId: 'admin',
  defaultEntityName: 'private',
  defaultReducer: docContentsReducer,
  isPrivate: true
}).then(({ config, getPrivateDataRepo }) => {
  config({
    port: 14014,
    typeDefs,
    resolvers
  })
    .addRepository(
      getPrivateDataRepo<DocContents, DocContentsEvents>({
        entityName: 'docContents',
        reducer: docContentsReducer
      })
    )
    .run();
});
