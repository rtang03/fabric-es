import {
  User,
  UserEvents,
  userReducer,
  userResolvers,
  userTypeDefs
} from '@espresso/common';
import { bootstrap, prepare } from './start-service';

prepare({
  enrollmentId: 'admin',
  defaultEntityName: 'user',
  defaultReducer: userReducer
}).then(({ getRepository, getPrivateDataRepo, reconcile, subscribeHub, ...rest }) => {
  bootstrap({
    port: 14001,
    typeDefs: userTypeDefs,
    resolvers: userResolvers,
    repositories: [
      {
        entityName: 'user',
        repository: getRepository<User, UserEvents>({
          entityName: 'user',
          reducer: userReducer
        })
      }
    ],
    reconcile,
    subscribeHub,
    ...rest
  });
});