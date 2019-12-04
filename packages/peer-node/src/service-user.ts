import {
  User,
  UserEvents,
  userReducer,
  userResolvers,
  userTypeDefs
} from '@espresso/model-loan';
import { startService } from './start-service';

startService({
  enrollmentId: 'admin',
  defaultEntityName: 'user',
  defaultReducer: userReducer
}).then(({ config, getRepository }) => {
  config({
    port: 14001,
    typeDefs: userTypeDefs,
    resolvers: userResolvers
  }).addRepository('user', getRepository<User, UserEvents>({
    entityName: 'user',
    reducer: userReducer
  })).run();
});
