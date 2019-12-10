import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  resolvers,
  typeDefs
} from './model/private';
import { startService } from './start-service';

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
  }).addRepository(getPrivateDataRepo<DocContents, DocContentsEvents>({
    entityName: 'docContents',
    reducer: docContentsReducer
  })).run();
});
