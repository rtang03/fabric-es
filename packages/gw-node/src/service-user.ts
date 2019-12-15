require('./env');

import {
  User,
  UserEvents,
  userReducer,
  userResolvers,
  userTypeDefs
} from '@espresso/model-common';
import { startService } from './utils/start-service';

startService({
  enrollmentId: 'admin',
  defaultEntityName: 'user',
  defaultReducer: userReducer
}).then(({ config, getRepository }) => {
  config({
    port: 14001,
    typeDefs: userTypeDefs,
    resolvers: userResolvers
  }).addRepository(getRepository<User, UserEvents>({
    entityName: 'user',
    reducer: userReducer
  })).run();
});
